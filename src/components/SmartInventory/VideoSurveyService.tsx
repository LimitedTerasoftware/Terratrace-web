// Enhanced VideoSurveyService.ts - Centralized video survey data processing with enhanced landmark detection
import { resolveMediaUrl } from './PlaceMark';

// Enhanced core interfaces
export interface VideoClip {
  id: string;
  videoUrl: string;
  startTimeStamp: number; // ms epoch
  endTimeStamp: number;   // ms epoch
  meta?: Record<string, any>;
}

export interface TrackPoint { 
  lat: number; 
  lng: number; 
  timestamp: number;
  surveyId?: string; // Add survey ID
}

// Enhanced segment selection interface
export interface SegmentSelection {
  start?: number; // timestamp in ms
  end?: number;   // timestamp in ms
}

export interface VideoSurveyData {
  trackPoints: TrackPoint[];
  videoClips: VideoClip[];
  metadata: {
    totalDuration: number;
    totalDistance?: number;
    surveyIds: string[];
    blockIds: string[];
  };
}

export interface ValidationResult {
  trackPointCount: number;
  videoClipCount: number;
  issues: string[];
  isValid: boolean;
}

// Enhanced landmark detection interfaces
export interface LandmarkDetectionResult {
  hasLandmark: boolean;
  landmarks: any[];
  position: { lat: number; lng: number } | null;
  detectionTime: number;
}

// Enhanced Video Survey Service Class
export class VideoSurveyService {
  
  /**
   * Main processing function - extracts all video survey data from raw physical survey response
   */
  static processPhysicalSurveyData(rawPhysicalSurveyData: any): VideoSurveyData {
    if (!rawPhysicalSurveyData?.data) {
      return this.createEmptyVideoSurveyData();
    }
    
    const trackPoints = this.buildTrackPoints(rawPhysicalSurveyData);
    const videoClips = this.buildVideoClips(rawPhysicalSurveyData);
    const metadata = this.generateMetadata(rawPhysicalSurveyData, trackPoints, videoClips);

    return {
      trackPoints,
      videoClips,
      metadata
    };
  }

  // ==============================================
  // ENHANCED LANDMARK DETECTION METHODS
  // ==============================================

  /**
   * Find landmarks at exact GPS coordinates (coordinate-based, not radius-based)
   */
  static findLandmarksAtPosition(
    physicalSurveyData: any[],
    currentPosition: { lat: number; lng: number },
    tolerance: number = 0.0001 // ~10 meters
  ): any[] {
    if (!currentPosition) return [];
    
    return physicalSurveyData.filter(placemark => {
      // Only check landmark-type events
      const landmarkTypes = ['LANDMARK', 'FIBERTURN', 'JOINTCHAMBER', 'KILOMETERSTONE', 'ROUTEINDICATOR'];
      if (!landmarkTypes.includes(placemark.eventType || placemark.category)) {
        return false;
      }
      
      // Check if coordinates match within tolerance
      const latDiff = Math.abs(currentPosition.lat - placemark.coordinates.lat);
      const lngDiff = Math.abs(currentPosition.lng - placemark.coordinates.lng);
      
      return latDiff <= tolerance && lngDiff <= tolerance;
    });
  }

  /**
   * Enhanced landmark detection for video playback with precise coordinate matching
   */
  static detectLandmarkAtCurrentTime(
    physicalSurveyData: any[],
    currentTime: number,
    trackPoints: TrackPoint[],
    visibleCategories: Set<string>,
    tolerance: number = 0.0001
  ): LandmarkDetectionResult {
    // Get current position from track points
    const currentPosition = this.interpolatePosition(trackPoints, currentTime);
    
    if (!currentPosition) {
      return { 
        hasLandmark: false, 
        landmarks: [], 
        position: null,
        detectionTime: currentTime
      };
    }
    
    // Find landmarks at current position using coordinate matching
    const landmarks = physicalSurveyData.filter(landmark => {
      const landmarkTypes = ['LANDMARK', 'FIBERTURN', 'JOINTCHAMBER', 'KILOMETERSTONE', 'ROUTEINDICATOR'];
      if (!landmarkTypes.includes(landmark.eventType || landmark.category)) {
        return false;
      }
      
      // Check if landmark category is visible on map
      const categoryId = `physical-${(landmark.category || landmark.eventType).toLowerCase().replace(/\s+/g, '-')}`;
      if (!visibleCategories.has(categoryId)) {
        return false;
      }
      
      // Check coordinate proximity using precise matching
      const latDiff = Math.abs(currentPosition.lat - landmark.coordinates.lat);
      const lngDiff = Math.abs(currentPosition.lng - landmark.coordinates.lng);
      
      return latDiff <= tolerance && lngDiff <= tolerance;
    });
    
    return {
      hasLandmark: landmarks.length > 0,
      landmarks,
      position: currentPosition,
      detectionTime: currentTime
    };
  }

  /**
   * Check if we should show landmark modal (avoid showing same landmark repeatedly)
   */
  static shouldShowLandmarkModal(
    currentLandmarks: any[],
    previousLandmarks: any[],
    showingModal: boolean
  ): boolean {
    // If no current landmarks, don't show modal
    if (currentLandmarks.length === 0) {
      return false;
    }
    
    // If modal is already showing and landmarks are the same, keep showing
    if (showingModal && this.areLandmarksSame(currentLandmarks, previousLandmarks)) {
      return true;
    }
    
    // If modal is not showing and we have new landmarks, show modal
    if (!showingModal && currentLandmarks.length > 0) {
      return true;
    }
    
    return false;
  }

  /**
   * Compare two landmark arrays to see if they're the same
   */
  static areLandmarksSame(landmarks1: any[], landmarks2: any[]): boolean {
    if (landmarks1.length !== landmarks2.length) return false;
    
    const ids1 = landmarks1.map(l => l.id).sort();
    const ids2 = landmarks2.map(l => l.id).sort();
    
    return ids1.every((id, index) => id === ids2[index]);
  }

  /**
   * Get landmark statistics for current detection
   */
  static getLandmarkStatistics(landmarks: any[]): {
    totalCount: number;
    typeBreakdown: Record<string, number>;
    hasImages: boolean;
    totalImages: number;
  } {
    const typeBreakdown: Record<string, number> = {};
    let totalImages = 0;
    let hasImages = false;

    landmarks.forEach(landmark => {
      const type = landmark.eventType || landmark.category || 'UNKNOWN';
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
      
      if (landmark.hasImages && landmark.images) {
        hasImages = true;
        totalImages += landmark.images.length;
      }
    });

    return {
      totalCount: landmarks.length,
      typeBreakdown,
      hasImages,
      totalImages
    };
  }

  /**
   * Filter landmarks by type
   */
  static filterLandmarksByType(landmarks: any[], types: string[]): any[] {
    return landmarks.filter(landmark => {
      const landmarkType = landmark.eventType || landmark.category;
      return types.includes(landmarkType);
    });
  }

  /**
   * Get closest landmark to a position (for debugging/analysis)
   */
  static getClosestLandmark(
    physicalSurveyData: any[],
    targetPosition: { lat: number; lng: number }
  ): { landmark: any; distance: number } | null {
    let closest: { landmark: any; distance: number } | null = null;
    
    physicalSurveyData.forEach(landmark => {
      const landmarkTypes = ['LANDMARK', 'FIBERTURN', 'JOINTCHAMBER', 'KILOMETERSTONE', 'ROUTEINDICATOR'];
      if (!landmarkTypes.includes(landmark.eventType || landmark.category)) {
        return;
      }
      
      const distance = this.calculateDistance(
        targetPosition.lat,
        targetPosition.lng,
        landmark.coordinates.lat,
        landmark.coordinates.lng
      );
      
      if (!closest || distance < closest.distance) {
        closest = { landmark, distance };
      }
    });
    
    return closest;
  }

  // ==============================================
  // ENHANCED SEGMENT SELECTION UTILITIES
  // ==============================================

  /**
   * Enhanced segment selection utilities
   */
  static validateSegmentSelection(selection: SegmentSelection, videoClips: VideoClip[]): {
    isValid: boolean;
    issues: string[];
    affectedClips: VideoClip[];
  } {
    const issues: string[] = [];
    const affectedClips: VideoClip[] = [];

    if (!selection.start && !selection.end) {
      return { isValid: true, issues, affectedClips };
    }

    if (selection.start && selection.end) {
      if (selection.start >= selection.end) {
        issues.push('Start time must be before end time');
      }

      // Find clips that overlap with selection
      for (const clip of videoClips) {
        const selectionStart = Math.max(selection.start, clip.startTimeStamp);
        const selectionEnd = Math.min(selection.end, clip.endTimeStamp);
        
        if (selectionStart < selectionEnd) {
          affectedClips.push(clip);
        }
      }

      if (affectedClips.length === 0) {
        issues.push('Selection does not overlap with any video clips');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      affectedClips
    };
  }

  /**
   * Get playback segments for a selection across multiple clips
   */
  static getPlaybackSegments(selection: SegmentSelection, videoClips: VideoClip[]): {
    clipIndex: number;
    clip: VideoClip;
    startOffset: number; // seconds from clip start
    endOffset: number;   // seconds from clip start
    duration: number;    // seconds
  }[] {
    if (!selection.start || !selection.end) {
      return [];
    }

    const segments: any[] = [];
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);

    videoClips.forEach((clip, index) => {
      const clipStart = clip.startTimeStamp;
      const clipEnd = clip.endTimeStamp;
      
      // Check if clip overlaps with selection
      if (start < clipEnd && end > clipStart) {
        const segmentStart = Math.max(start, clipStart);
        const segmentEnd = Math.min(end, clipEnd);
        
        const startOffset = Math.max(0, (segmentStart - clipStart) / 1000);
        const endOffset = Math.min((clipEnd - clipStart) / 1000, (segmentEnd - clipStart) / 1000);
        
        segments.push({
          clipIndex: index,
          clip,
          startOffset,
          endOffset,
          duration: endOffset - startOffset
        });
      }
    });

    return segments;
  }

  /**
   * Enhanced position interpolation with segment awareness
   */
  static interpolatePositionInSelection(
    trackPoints: TrackPoint[], 
    timestamp: number, 
    selection?: SegmentSelection
  ): { lat: number; lng: number; isInSelection: boolean } | null {
    const position = this.interpolatePosition(trackPoints, timestamp);
    if (!position) return null;

    let isInSelection = true;
    if (selection?.start && selection?.end) {
      const start = Math.min(selection.start, selection.end);
      const end = Math.max(selection.start, selection.end);
      isInSelection = timestamp >= start && timestamp <= end;
    }

    return {
      ...position,
      isInSelection
    };
  }

  /**
   * Get track points within a selection
   */
  static getTrackPointsInSelection(trackPoints: TrackPoint[], selection: SegmentSelection): TrackPoint[] {
    if (!selection.start || !selection.end) {
      return trackPoints;
    }

    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);

    return trackPoints.filter(point => 
      point.timestamp >= start && point.timestamp <= end
    );
  }

  /**
   * Calculate selection statistics
   */
  static getSelectionStatistics(selection: SegmentSelection, trackPoints: TrackPoint[], videoClips: VideoClip[]): {
    duration: number; // ms
    distance: number; // meters (estimated)
    trackPointCount: number;
    videoClipCount: number;
    startPosition?: { lat: number; lng: number };
    endPosition?: { lat: number; lng: number };
  } {
    if (!selection.start || !selection.end) {
      return {
        duration: 0,
        distance: 0,
        trackPointCount: 0,
        videoClipCount: 0
      };
    }

    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const duration = end - start;

    const pointsInSelection = this.getTrackPointsInSelection(trackPoints, selection);
    const segmentsInSelection = this.getPlaybackSegments(selection, videoClips);

    // Estimate distance using track points
    let distance = 0;
    for (let i = 1; i < pointsInSelection.length; i++) {
      const prev = pointsInSelection[i - 1];
      const curr = pointsInSelection[i];
      distance += this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    }

    const startPosition = this.interpolatePosition(trackPoints, start);
    const endPosition = this.interpolatePosition(trackPoints, end);

    return {
      duration,
      distance,
      trackPointCount: pointsInSelection.length,
      videoClipCount: segmentsInSelection.length,
      startPosition: startPosition || undefined,
      endPosition: endPosition || undefined
    };
  }

  /**
   * Enhanced clip finding with segment support
   */
  static findClipsForSelection(videoClips: VideoClip[], selection: SegmentSelection): {
    primaryClip: VideoClip | null;
    primaryIndex: number;
    allAffectedClips: { clip: VideoClip; index: number }[];
  } {
    if (!selection.start) {
      return {
        primaryClip: null,
        primaryIndex: -1,
        allAffectedClips: []
      };
    }

    // Find primary clip (contains start time)
    const primaryMatch = this.findVideoClipForTimestamp(videoClips, selection.start);
    
    // Find all affected clips if end time exists
    const allAffectedClips: { clip: VideoClip; index: number }[] = [];
    if (selection.end) {
      const segments = this.getPlaybackSegments(selection, videoClips);
      allAffectedClips.push(...segments.map(seg => ({ clip: seg.clip, index: seg.clipIndex })));
    } else if (primaryMatch) {
      allAffectedClips.push({ clip: primaryMatch.clip, index: primaryMatch.index });
    }

    return {
      primaryClip: primaryMatch?.clip || null,
      primaryIndex: primaryMatch?.index || -1,
      allAffectedClips
    };
  }

  /**
   * Enhanced time navigation utilities
   */
  static getNextSegmentTime(currentTime: number, selection: SegmentSelection, trackPoints: TrackPoint[]): number | null {
    if (!selection.start || !selection.end) return null;

    const pointsInSelection = this.getTrackPointsInSelection(trackPoints, selection);
    const currentIndex = pointsInSelection.findIndex(p => p.timestamp >= currentTime);
    
    if (currentIndex === -1 || currentIndex >= pointsInSelection.length - 1) return null;
    
    return pointsInSelection[currentIndex + 1].timestamp;
  }

  static getPreviousSegmentTime(currentTime: number, selection: SegmentSelection, trackPoints: TrackPoint[]): number | null {
    if (!selection.start || !selection.end) return null;

    const pointsInSelection = this.getTrackPointsInSelection(trackPoints, selection);
    const currentIndex = pointsInSelection.findIndex(p => p.timestamp > currentTime);
    
    if (currentIndex <= 0) return null;
    
    return pointsInSelection[currentIndex - 1].timestamp;
  }

  // === EXISTING METHODS (keeping all original functionality) ===

  /**
   * Validates video survey data quality and reports issues
   */
  static validateVideoSurveyData(rawPhysicalSurveyData: any): ValidationResult {
    const issues: string[] = [];
    let trackPointCount = 0;
    let videoClipCount = 0;
    
    if (!rawPhysicalSurveyData?.data) {
      issues.push('No data found in rawPhysical');
      return { trackPointCount, videoClipCount, issues, isValid: false };
    }
    
    Object.entries(rawPhysicalSurveyData.data).forEach(([blockId, rows]) => {
      if (!Array.isArray(rows)) {
        issues.push(`Block ${blockId} data is not an array`);
        return;
      }
      
      rows.forEach((r: any, index: number) => {
        if (r.event_type === 'LIVELOCATION') {
          const lat = Number(r.latitude);
          const lng = Number(r.longitude);
          const ts = this.parseTimestamp(r.createdTime) || this.parseTimestamp(r.created_at);
          
          if (this.isValidCoordinate(lat, lng) && isFinite(ts)) {
            trackPointCount++;
          } else {
            issues.push(`Invalid LIVELOCATION at block ${blockId}, index ${index}: lat=${lat}, lng=${lng}, ts=${ts}`);
          }
        }
        
        if (r.event_type === 'VIDEORECORD') {
          try {
            if (!r.videoDetails) {
              issues.push(`VIDEORECORD missing videoDetails at block ${blockId}, index ${index}`);
              return;
            }
            
            const vd = JSON.parse(r.videoDetails);
            if (vd?.videoUrl && vd.videoUrl.trim() !== '') {
              const start = this.parseTimestamp(vd.startTimeStamp);
              const end = this.parseTimestamp(vd.endTimeStamp);
              if (isFinite(start) && isFinite(end) && start < end) {
                videoClipCount++;
              } else {
                issues.push(`Invalid timestamps in VIDEORECORD at block ${blockId}, index ${index}`);
              }
            } else {
              issues.push(`Missing or empty videoUrl in VIDEORECORD at block ${blockId}, index ${index}`);
            }
          } catch (error) {
            issues.push(`Failed to parse videoDetails at block ${blockId}, index ${index}: ${error}`);
          }
        }
      });
    });
    
    return { 
      trackPointCount, 
      videoClipCount, 
      issues, 
      isValid: issues.length === 0 && (trackPointCount > 0 || videoClipCount > 0)
    };
  }

  /**
   * Simplified track point extraction matching video playback page approach
   */
  private static buildTrackPoints(rawPhysicalSurveyData: any): TrackPoint[] {
    if (!rawPhysicalSurveyData?.data) {
      return [];
    }
    
    // Group all data by survey ID first (like video playbook page)
    const surveyGroups: Record<string, any[]> = {};
    
    Object.entries(rawPhysicalSurveyData.data).forEach(([blockId, points]) => {
      if (!Array.isArray(points)) return;
      
      points.forEach(point => {
        if (point.survey_id) {
          if (!surveyGroups[point.survey_id]) {
            surveyGroups[point.survey_id] = [];
          }
          surveyGroups[point.survey_id].push(point);
        }
      });
    });
    
    // Process each survey group separately
    const allTrackPoints: TrackPoint[] = [];
    
    Object.entries(surveyGroups).forEach(([surveyId, surveyPoints]) => {
      const surveyTrackPoints = surveyPoints
        .filter(item => {
          if (item.event_type === 'LIVELOCATION') return true;
          if (item.event_type === 'VIDEORECORD' && item.surveyUploaded === 'true') {
            try {
              const videoDetails = JSON.parse(item.videoDetails);
              return videoDetails?.startLatitude && videoDetails?.startLongitude &&
                     videoDetails?.endLatitude && videoDetails?.endLongitude;
            } catch (error) {
              return false;
            }
          }
          return false;
        })
        .flatMap(item => {
          if (item.event_type === 'LIVELOCATION') {
            return [{
              lat: parseFloat(item.latitude),
              lng: parseFloat(item.longitude),
              timestamp: this.getEventTime(item),
              surveyId: item.survey_id // Add survey ID to track points
            }];
          } else if (item.event_type === 'VIDEORECORD') {
            try {
              const videoDetails = JSON.parse(item.videoDetails);
              return [
                {
                  lat: videoDetails.startLatitude,
                  lng: videoDetails.startLongitude,
                  timestamp: videoDetails.startTimeStamp,
                  surveyId: item.survey_id
                },
                {
                  lat: videoDetails.endLatitude,
                  lng: videoDetails.endLongitude,
                  timestamp: videoDetails.endTimeStamp,
                  surveyId: item.survey_id
                }
              ];
            } catch (error) {
              return [];
            }
          }
          return [];
        })
        .sort((a, b) => a.timestamp - b.timestamp); // Sort within each survey
      
      allTrackPoints.push(...surveyTrackPoints);
    });
    
    return allTrackPoints;
  }

  /**
   * Get event time (matching video playback page logic)
   */
  private static getEventTime(item: any, isEnd = false): number {
    if (item.event_type === "VIDEORECORD") {
      try {
        const videoDetails = JSON.parse(item.videoDetails);
        return isEnd
          ? videoDetails?.endTimeStamp ?? 0
          : videoDetails?.startTimeStamp ?? 0;
      } catch (error) {
        return 0;
      }
    }
    return new Date(item.createdTime || item.created_at).getTime();
  }

  /**
   * Simplified video clip extraction matching video playback page
   */
  private static buildVideoClips(rawPhysicalSurveyData: any): VideoClip[] {
    if (!rawPhysicalSurveyData?.data) {
      return [];
    }
    
    const clips: VideoClip[] = [];
    
    Object.entries(rawPhysicalSurveyData.data).forEach(([blockId, points]) => {
      if (!Array.isArray(points)) return;
      
      // Filter video records (same logic as video playback page)
      const videos = points.filter(item =>
        item.event_type === "VIDEORECORD" && 
        item.surveyUploaded === 'true' &&
        item.videoDetails &&
        item.videoDetails.trim() !== ""
      );
      
      videos.forEach(video => {
        try {
          const videoDetails = JSON.parse(video.videoDetails);
          
          // Check for valid video URL (same as video playback page)
          const videoUrl = videoDetails?.videoUrl?.trim().replace(/(^"|"$)/g, '');
          if (!videoUrl || videoUrl === "") {
            return;
          }
          
          clips.push({
            id: `${video.survey_id}_${videoDetails.startTimeStamp}`,
            videoUrl: resolveMediaUrl(videoUrl),
            startTimeStamp: videoDetails.startTimeStamp,
            endTimeStamp: videoDetails.endTimeStamp,
            meta: {
              surveyId: video.survey_id,
              blockId: blockId,
              area_type: video.area_type,
              side_type: video.side_type,
              route_details: video.route_details,
              originalVideoDetails: videoDetails
            }
          });
        } catch (error) {
          console.warn(`Failed to parse video details for survey ${video.survey_id}:`, error);
        }
      });
    });
    
    // Sort clips by start timestamp
    return clips.sort((a, b) => a.startTimeStamp - b.startTimeStamp);
  }

  /**
   * Position interpolation matching video playbook page getPositionAtTime function
   */
  public static interpolatePosition(trackPoints: TrackPoint[], timestamp: number): { lat: number; lng: number } | null {
    if (!trackPoints.length) return null;
    
    // If timestamp is before first point
    if (timestamp <= trackPoints[0].timestamp) {
      return { lat: trackPoints[0].lat, lng: trackPoints[0].lng };
    }
    
    // If timestamp is after last point
    if (timestamp >= trackPoints[trackPoints.length - 1].timestamp) {
      const lastPoint = trackPoints[trackPoints.length - 1];
      return { lat: lastPoint.lat, lng: lastPoint.lng };
    }
    
    // Find two points that timestamp falls between
    for (let i = 0; i < trackPoints.length - 1; i++) {
      const current = trackPoints[i];
      const next = trackPoints[i + 1];
      
      if (timestamp >= current.timestamp && timestamp <= next.timestamp) {
        // Calculate position using linear interpolation (exact same as video page)
        const ratio = (timestamp - current.timestamp) / (next.timestamp - current.timestamp);
        return {
          lat: current.lat + (next.lat - current.lat) * ratio,
          lng: current.lng + (next.lng - current.lng) * ratio
        };
      }
    }
    
    return null;
  }

  /**
   * Generate metadata about the video survey
   */
  private static generateMetadata(rawData: any, trackPoints: TrackPoint[], videoClips: VideoClip[]): VideoSurveyData['metadata'] {
    const surveyIds = new Set<string>();
    const blockIds = new Set<string>();
    
    // Extract IDs from raw data
    Object.entries(rawData.data || {}).forEach(([blockId, rows]) => {
      blockIds.add(blockId);
      if (Array.isArray(rows)) {
        rows.forEach((row: any) => {
          if (row.survey_id) {
            surveyIds.add(row.survey_id);
          }
        });
      }
    });
    
    // Calculate total duration
    let totalDuration = 0;
    if (trackPoints.length > 1) {
      totalDuration = trackPoints[trackPoints.length - 1].timestamp - trackPoints[0].timestamp;
    }
    
    return {
      totalDuration,
      surveyIds: Array.from(surveyIds),
      blockIds: Array.from(blockIds)
    };
  }

  /**
   * Create empty video survey data structure
   */
  private static createEmptyVideoSurveyData(): VideoSurveyData {
    return {
      trackPoints: [],
      videoClips: [],
      metadata: {
        totalDuration: 0,
        surveyIds: [],
        blockIds: []
      }
    };
  }

  // === UTILITY FUNCTIONS (Enhanced) ===

  /**
   * Parse timestamp from various formats to milliseconds
   */
  public static parseTimestamp(timeStr: string | number | undefined): number {
    if (!timeStr) return NaN;
    
    if (typeof timeStr === 'number') {
      return timeStr;
    }
    
    const parsed = Number(timeStr);
    if (isFinite(parsed)) {
      // If it's already a large number (epoch ms), return as-is
      if (parsed > 1000000000000) return parsed;
      // If it's a smaller number, might be seconds - convert to ms
      if (parsed > 1000000000) return parsed * 1000;
    }
    
    // Fallback to Date.parse for string dates
    return Date.parse(timeStr);
  }

  /**
   * Validate coordinate values
   */
  public static isValidCoordinate(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' && typeof lng === 'number' &&
      isFinite(lat) && isFinite(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      lat !== 0 && lng !== 0 // Exclude null island
    );
  }

  /**
   * Find the appropriate video clip for a given timestamp
   */
  public static findVideoClipForTimestamp(videoClips: VideoClip[], timestamp: number): { clip: VideoClip; index: number } | null {
    for (let i = 0; i < videoClips.length; i++) {
      const clip = videoClips[i];
      if (timestamp >= clip.startTimeStamp && timestamp <= clip.endTimeStamp) {
        return { clip, index: i };
      }
    }
    return null;
  }

  /**
   * Find the nearest video clip to a timestamp
   */
  public static findNearestVideoClip(videoClips: VideoClip[], timestamp: number): { clip: VideoClip; index: number } | null {
    if (!videoClips.length) return null;
    
    let nearestIndex = 0;
    let minDistance = Math.min(
      Math.abs(timestamp - videoClips[0].startTimeStamp),
      Math.abs(timestamp - videoClips[0].endTimeStamp)
    );
    
    for (let i = 1; i < videoClips.length; i++) {
      const clip = videoClips[i];
      const distance = Math.min(
        Math.abs(timestamp - clip.startTimeStamp),
        Math.abs(timestamp - clip.endTimeStamp)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }
    
    return { clip: videoClips[nearestIndex], index: nearestIndex };
  }

  /**
   * Enhanced distance calculation using Haversine formula
   */
  public static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Format duration in milliseconds to human readable format
   */
  public static formatDuration(milliseconds: number): string {
    if (!isFinite(milliseconds)) return '00:00:00';
    
    const totalSeconds = Math.floor(Math.abs(milliseconds) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Enhanced time formatting for selection displays
   */
  public static formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  }

  /**
   * Format selection duration with context
   */
  public static formatSelectionDuration(selection: SegmentSelection): string {
    if (!selection.start || !selection.end) return 'No selection';
    
    const duration = Math.abs(selection.end - selection.start);
    const formatted = this.formatDuration(duration);
    
    const startTime = this.formatTimestamp(selection.start);
    const endTime = this.formatTimestamp(selection.end);
    
    return `${formatted} (${startTime} - ${endTime})`;
  }

  /**
   * Get time bounds for the entire survey
   */
  public static getSurveyTimeBounds(videoSurveyData: VideoSurveyData): { start: number; end: number; duration: number } {
    const { trackPoints, videoClips } = videoSurveyData;
    
    let start = Infinity;
    let end = -Infinity;
    
    // Consider track points
    trackPoints.forEach(point => {
      start = Math.min(start, point.timestamp);
      end = Math.max(end, point.timestamp);
    });
    
    // Consider video clips
    videoClips.forEach(clip => {
      start = Math.min(start, clip.startTimeStamp);
      end = Math.max(end, clip.endTimeStamp);
    });
    
    if (!isFinite(start) || !isFinite(end)) {
      return { start: 0, end: 0, duration: 0 };
    }
    
    return {
      start,
      end,
      duration: end - start
    };
  }

  /**
   * Create a selection that spans the entire survey
   */
  public static createFullSurveySelection(videoSurveyData: VideoSurveyData): SegmentSelection {
    const bounds = this.getSurveyTimeBounds(videoSurveyData);
    return {
      start: bounds.start,
      end: bounds.end
    };
  }

  /**
   * Enhanced logging helper for debugging landmark detection
   */
  public static logLandmarkDetection(
    currentTime: number,
    currentPosition: { lat: number; lng: number } | null,
    landmarks: any[],
    prefix: string = 'Landmark Detection'
  ): void {
    console.group(`${prefix} - ${new Date(currentTime).toLocaleTimeString()}`); 
    console.groupEnd();
  }

  /**
   * Enhanced logging helper for debugging selection info
   */
  public static logSelectionInfo(
    selection: SegmentSelection, 
    videoSurveyData: VideoSurveyData,
    prefix: string = 'Selection'
  ): void {
    if (!selection.start && !selection.end) {
      null;
      return;
    }

    const stats = this.getSelectionStatistics(selection, videoSurveyData.trackPoints, videoSurveyData.videoClips);
    const validation = this.validateSegmentSelection(selection, videoSurveyData.videoClips);
        
    if (validation.issues.length > 0) {
      console.warn('Selection Issues:', validation.issues);
    }
    
    console.groupEnd();
  }
}