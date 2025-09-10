// Enhanced VideoSurveyService.ts - Centralized video survey data processing with segment selection
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
   * Builds GPS track points from LIVELOCATION and VIDEORECORD events
   */
  private static buildTrackPoints(rawPhysicalSurveyData: any): TrackPoint[] {
    
    if (!rawPhysicalSurveyData?.data) {
      console.warn('No data found in rawPhysical');
      return [];
    }
    
    const points: TrackPoint[] = [];
    
    Object.entries(rawPhysicalSurveyData.data).forEach(([blockId, rows]) => {
      
      if (!Array.isArray(rows)) {
        console.warn(`Block ${blockId} data is not an array:`, rows);
        return;
      }
      
      rows.forEach((r: any, index: number) => {
        // Process LIVELOCATION points (main GPS track)
        if (r.event_type === 'LIVELOCATION') {
          const point = this.processLiveLocationPoint(r, blockId, index);
          if (point) {
            points.push(point);
          }
        }
        
        // Process VIDEORECORD start/end points
        if (r.event_type === 'VIDEORECORD' && r.videoDetails) {
          const videoPoints = this.processVideoRecordPoints(r, blockId, index);
          points.push(...videoPoints);
        }
      });
    });
    
    
    // Sort by timestamp and remove duplicates
    return this.deduplicateTrackPoints(points);
  }

  /**
   * Process a single LIVELOCATION event into a TrackPoint
   */
  private static processLiveLocationPoint(record: any, blockId: string, index: number): TrackPoint | null {
    const lat = Number(record.latitude);
    const lng = Number(record.longitude);
    const ts = this.parseTimestamp(record.createdTime) || this.parseTimestamp(record.created_at);
    
    if (this.isValidCoordinate(lat, lng) && isFinite(ts)) {
      return { lat, lng, timestamp: ts };
    } else {
      console.warn(`Invalid LIVELOCATION at ${blockId}-${index}:`, { lat, lng, ts });
      return null;
    }
  }

  /**
   * Process VIDEORECORD events to extract start/end points
   */
  private static processVideoRecordPoints(record: any, blockId: string, index: number): TrackPoint[] {
    const points: TrackPoint[] = [];
    
    try {
      const videoDetails = JSON.parse(record.videoDetails);
      
      if (videoDetails?.videoUrl?.trim()) {
        const startPoint = this.extractVideoPoint(
          videoDetails.startLatitude,
          videoDetails.startLongitude,
          videoDetails.startTimeStamp,
          'start'
        );
        
        const endPoint = this.extractVideoPoint(
          videoDetails.endLatitude,
          videoDetails.endLongitude,
          videoDetails.endTimeStamp,
          'end'
        );
        
        if (startPoint) {
          points.push(startPoint);
        }
        
        if (endPoint) {
          points.push(endPoint);
        }
      }
    } catch (error) {
      console.warn('Invalid videoDetails JSON:', record.videoDetails, error);
    }
    
    return points;
  }

  /**
   * Extract and validate a single video point (start or end)
   */
  private static extractVideoPoint(lat: any, lng: any, timestamp: any, type: string): TrackPoint | null {
    const latitude = Number(lat);
    const longitude = Number(lng);
    const ts = this.parseTimestamp(timestamp);
    
    if (this.isValidCoordinate(latitude, longitude) && isFinite(ts)) {
      return { lat: latitude, lng: longitude, timestamp: ts };
    }
    
    console.warn(`Invalid video ${type} point:`, { lat, lng, timestamp });
    return null;
  }

  /**
   * Remove duplicate track points and sort by timestamp
   */
  private static deduplicateTrackPoints(points: TrackPoint[]): TrackPoint[] {
    // Sort by timestamp
    points.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove duplicates by timestamp
    const deduplicated: TrackPoint[] = [];
    let lastTimestamp = -Infinity;
    
    for (const point of points) {
      if (point.timestamp !== lastTimestamp) {
        deduplicated.push(point);
        lastTimestamp = point.timestamp;
      }
    }
    
    return deduplicated;
  }

  /**
   * Build video clips from VIDEORECORD events
   */
  private static buildVideoClips(rawPhysicalSurveyData: any): VideoClip[] {
    const clips: VideoClip[] = [];
    
    if (!rawPhysicalSurveyData?.data) {
      return clips;
    }

    Object.values(rawPhysicalSurveyData.data).forEach((rows: any) => {
      if (!Array.isArray(rows)) return;
      
      rows.forEach((record: any) => {
        if (record.event_type === 'VIDEORECORD' && record.videoDetails) {
          const clip = this.processVideoRecord(record);
          if (clip) {
            clips.push(clip);
          }
        }
      });
    });

    // Sort clips by start timestamp
    clips.sort((a, b) => a.startTimeStamp - b.startTimeStamp);
    
    // Validate clip sequence
    this.validateClipSequence(clips);
    
    return clips;
  }

  /**
   * Process a single VIDEORECORD into a VideoClip
   */
  private static processVideoRecord(record: any): VideoClip | null {
    try {
      const videoDetails = JSON.parse(record.videoDetails);
      
      // Validate video details structure
      if (!this.isValidVideoDetails(videoDetails)) {
        return null;
      }
      
      const start = this.parseTimestamp(videoDetails.startTimeStamp);
      const end = this.parseTimestamp(videoDetails.endTimeStamp);
      
      // Validate timestamps
      if (!isFinite(start) || !isFinite(end)) {
        console.warn('Invalid timestamps in videoDetails:', { start, end, videoDetails });
        return null;
      }
      
      if (start >= end) {
        console.warn('Start timestamp must be before end timestamp:', { start, end });
        return null;
      }
      
      // Build full URL
      const url = resolveMediaUrl(videoDetails.videoUrl);
      if (!url) {
        console.warn('Failed to resolve video URL:', videoDetails.videoUrl);
        return null;
      }
      
      return {
        id: `${record.survey_id}_${start}`,
        videoUrl: url,
        startTimeStamp: start,
        endTimeStamp: end,
        meta: {
          surveyId: record.survey_id,
          area_type: record.area_type,
          side_type: record.side_type,
          route_details: record.route_details,
          originalVideoDetails: videoDetails
        }
      };
      
    } catch (error) {
      console.error('Error parsing videoDetails for VIDEORECORD:', {
        surveyId: record.survey_id,
        videoDetails: record.videoDetails,
        error
      });
      return null;
    }
  }

  /**
   * Validate video details object structure
   */
  private static isValidVideoDetails(videoDetails: any): boolean {
    if (!videoDetails || typeof videoDetails !== 'object') {
      console.warn('Invalid videoDetails object:', videoDetails);
      return false;
    }
    
    if (!videoDetails.videoUrl || typeof videoDetails.videoUrl !== 'string' || videoDetails.videoUrl.trim() === '') {
      console.warn('Missing or empty videoUrl in videoDetails:', videoDetails);
      return false;
    }
    
    return true;
  }

  /**
   * Validate clip sequence for overlaps
   */
  private static validateClipSequence(clips: VideoClip[]): void {
    for (let i = 1; i < clips.length; i++) {
      const prev = clips[i - 1];
      const curr = clips[i];
      
      if (curr.startTimeStamp < prev.endTimeStamp) {
        console.warn('Overlapping video clips detected:', {
          prevClip: prev.id,
          currClip: curr.id,
          overlap: prev.endTimeStamp - curr.startTimeStamp
        });
      }
    }
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
   * Interpolate position along track at specific timestamp
   */
  public static interpolatePosition(track: TrackPoint[], timestamp: number): { lat: number; lng: number } | null {
    if (!track.length) return null;
    
    // Handle edge cases
    if (timestamp <= track[0].timestamp) {
      return { lat: track[0].lat, lng: track[0].lng };
    }
    if (timestamp >= track[track.length - 1].timestamp) {
      const last = track[track.length - 1];
      return { lat: last.lat, lng: last.lng };
    }
    
    // Binary search for position
    let lo = 0, hi = track.length - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (track[mid].timestamp <= timestamp) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    
    const pointA = track[lo];
    const pointB = track[hi];
    const alpha = (timestamp - pointA.timestamp) / (pointB.timestamp - pointA.timestamp);
    
    // Simple linear interpolation for coordinates
    // For more accuracy over long distances, consider great circle interpolation
    return {
      lat: pointA.lat + (pointB.lat - pointA.lat) * alpha,
      lng: pointA.lng + (pointB.lng - pointA.lng) * alpha
    };
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
   * Enhanced logging helper for debugging
   */
  public static logSelectionInfo(
    selection: SegmentSelection, 
    videoSurveyData: VideoSurveyData,
    prefix: string = 'Selection'
  ): void {
    if (!selection.start && !selection.end) {
      return;
    }

    const stats = this.getSelectionStatistics(selection, videoSurveyData.trackPoints, videoSurveyData.videoClips);
    const validation = this.validateSegmentSelection(selection, videoSurveyData.videoClips);
    
    console.group(`${prefix} Info`);
    if (validation.issues.length > 0) {
    }
    console.groupEnd();
  }
}