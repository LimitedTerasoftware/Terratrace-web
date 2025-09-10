import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { VideoSurveyService, VideoClip, TrackPoint } from './VideoSurveyService';
import { Play, Pause, RotateCcw, RotateCw, SkipBack, SkipForward, Volume2, MapPin, Clock } from 'lucide-react';

interface SurveyVideoPanelProps {
  open: boolean;
  onClose: () => void;

  // video set
  availableVideos: VideoClip[];
  currentVideoIndex: number;
  onChangeVideoIndex: (i: number) => void;

  // absolute survey time
  currentTime: number; // ms
  onTimeChange: (t: number) => void;

  // selection window (absolute ms)
  selection: { start?: number; end?: number };
  onSelectionChange: (sel: { start?: number; end?: number }) => void;

  // GPS track points for enhanced interaction
  trackPoints: TrackPoint[];
  currentPosition?: { lat: number; lng: number };

  // summary block
  surveySummary?: React.ReactNode;
}

// Enhanced Video Player Component with FIXED Stable Features
const EnhancedVideoPlayer: React.FC<{
  videoUrl: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  startTime?: number;
  endTime?: number;
  currentPosition?: { lat: number; lng: number };
  trackPoints: TrackPoint[];
  onNextVideo?: () => void;
  onPreviousVideo?: () => void;
  hasNextVideo?: boolean;
  hasPreviousVideo?: boolean;
  className?: string;
}> = ({
  videoUrl,
  currentTime,
  onTimeUpdate,
  startTime,
  endTime,
  currentPosition,
  trackPoints,
  onNextVideo,
  onPreviousVideo,
  hasNextVideo = false,
  hasPreviousVideo = false,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  
  // FIXED: Use refs to prevent excessive re-renders and stabilize updates
  const lastUpdateTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const stableUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentVideoUrlRef = useRef<string>('');

  // Normalize time to be within video bounds
  const normalizeTime = useCallback((time: number): number => {
    const videoTime = startTime ? (time - startTime) / 1000 : time / 1000;
    if (videoTime < 0) return 0;
    if (duration > 0 && videoTime > duration) return duration;
    return videoTime;
  }, [startTime, duration]);

  // FIXED: Reset states when video URL changes
  useEffect(() => {
    if (currentVideoUrlRef.current !== videoUrl) {
      currentVideoUrlRef.current = videoUrl;
      setIsLoading(true);
      setIsPlaying(false);
      setHasStartedPlaying(false);
      setProgress(0);
      setRotation(0);
      isSeekingRef.current = false;
      lastUpdateTimeRef.current = 0;
      
      // Clear any existing intervals
      if (stableUpdateIntervalRef.current) {
        clearInterval(stableUpdateIntervalRef.current);
        stableUpdateIntervalRef.current = null;
      }
    }
  }, [videoUrl]);

  // FIXED: Sync video with external currentTime (with debouncing)
  useEffect(() => {
  const video = videoRef.current;
  if (video && !isSeekingRef.current && duration > 0) {
    const targetTime = normalizeTime(currentTime);
    const timeDiff = Math.abs(video.currentTime - targetTime);
    
    // Always seek on initial load or if difference is significant
    if (timeDiff > 0.1 || !hasStartedPlaying) { // <-- Changed from 1.0 to 0.1 for better precision
      isSeekingRef.current = true;
      video.currentTime = targetTime;
      
      // Ensure the video element recognizes the seek
      video.addEventListener('seeked', function onSeeked() {
        isSeekingRef.current = false;
        video.removeEventListener('seeked', onSeeked);
      });
    }
  }
}, [currentTime, normalizeTime, duration, hasStartedPlaying]);

  // Handle video metadata loading
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  }, []);

  // FIXED: Stable time update mechanism - removes throttling issues
  const handleTimeUpdate = useCallback(() => {
  const video = videoRef.current;
  if (!video || !hasStartedPlaying || isSeekingRef.current) return;

  const currentVideoTime = video.currentTime;
  setProgress(currentVideoTime / duration);

  const timestamp = startTime ? startTime + currentVideoTime * 1000 : currentVideoTime * 1000;
  
  // Update at reasonable rate - video natural framerate is enough
  onTimeUpdate(timestamp);

  if (endTime && timestamp >= endTime) {
    video.pause();
    setIsPlaying(false);
    setHasStartedPlaying(false);
  }
}, [duration, startTime, endTime, onTimeUpdate, hasStartedPlaying]);

  // FIXED: Additional stable update mechanism for when video is playing
  useEffect(() => {
  if (isPlaying && hasStartedPlaying) {
    // Don't create additional interval - rely on video's timeupdate event
    // which fires naturally at the video's framerate
  }
  
  return () => {
    // Cleanup if needed
  };
}, [isPlaying, hasStartedPlaying]);

  // Enhanced playback controls
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setHasStartedPlaying(false); // FIXED: Reset playing state on pause
    } else {
      video.play()
        .then(() => {
          setIsPlaying(true);
          setHasStartedPlaying(true);
        })
        .catch((err) => {
          console.warn("Play failed:", err);
          setIsPlaying(false);
        });
    }
  }, [isPlaying]);

  // FIXED: Enhanced seek controls with seeking state management
  const seekForward = useCallback(() => {
    if (videoRef.current) {
      isSeekingRef.current = true;
      const newTime = Math.min(videoRef.current.currentTime + 5, duration);
      videoRef.current.currentTime = newTime;
      setProgress(newTime / duration);
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 100);
    }
  }, [duration]);

  const seekBackward = useCallback(() => {
    if (videoRef.current) {
      isSeekingRef.current = true;
      const newTime = Math.max(videoRef.current.currentTime - 5, 0);
      videoRef.current.currentTime = newTime;
      setProgress(newTime / duration);
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 100);
    }
  }, []);

  // FIXED: Seek bar interaction with seeking state
  const handleSeekBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || !videoRef.current) return;

    const rect = seekBarRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newTime = position * duration;

    isSeekingRef.current = true;
    videoRef.current.currentTime = newTime;
    setProgress(position);
    
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 100);
  }, [duration]);

  // Volume control
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  // Rotation controls
  const rotateVideo = useCallback((direction: 'cw' | 'ccw') => {
    const newRotation = direction === 'cw'
      ? (rotation + 90) % 360
      : (rotation - 90 + 360) % 360;
    setRotation(newRotation);
  }, [rotation]);

  // Video end handler
  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setHasStartedPlaying(false);
    if (hasNextVideo && onNextVideo) {
      onNextVideo();
    }
  }, [hasNextVideo, onNextVideo]);

  // Handle video errors
  const handleVideoError = useCallback(() => {
    console.error('Video error occurred');
    setIsLoading(false);
    setIsPlaying(false);
    setHasStartedPlaying(false);
  }, []);

  // FIXED: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stableUpdateIntervalRef.current) {
        clearInterval(stableUpdateIntervalRef.current);
      }
    };
  }, []);

  // Find current GPS coordinates for display
  const currentCoordinates = useMemo(() => {
    if (!currentPosition || !trackPoints.length) return null;
    
    const matchedPoint = trackPoints.find(
      p => Math.abs(p.lat - currentPosition.lat) < 0.00001 && 
           Math.abs(p.lng - currentPosition.lng) < 0.00001
    );
    
    return matchedPoint ? {
      lat: matchedPoint.lat.toFixed(6),
      lng: matchedPoint.lng.toFixed(6)
    } : {
      lat: currentPosition.lat.toFixed(6),
      lng: currentPosition.lng.toFixed(6)
    };
  }, [currentPosition, trackPoints]);

  return (
    <div className={`rounded-lg bg-gray-900 shadow-lg ${className}`}>
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {/* Position overlay */}
        {currentCoordinates && (
          <div className="absolute top-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm z-10 flex items-center justify-between">
            <div className="flex items-center">
              <MapPin size={16} className="mr-2" />
              <span>{currentCoordinates.lat}°, {currentCoordinates.lng}°</span>
            </div>
            <div className="flex items-center ml-4">
              <Clock size={16} className="mr-2" />
              <span>{new Date(currentTime).toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {/* Video container with rotation */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          <div 
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
            className="max-h-full w-full"
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-h-full w-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              preload="metadata"
              playsInline
            />
          </div>
        </div>

        {/* Enhanced video controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Seek bar */}
          <div
            ref={seekBarRef}
            className="h-1 bg-gray-600 rounded-full mb-2 cursor-pointer"
            onClick={handleSeekBarClick}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
  {/* Left controls */}
  <div className="flex items-center space-x-2">
    <button
      className={`p-1.5 rounded-full ${
        hasPreviousVideo
          ? 'bg-gray-800/50 hover:bg-gray-700/50 text-white'
          : 'bg-gray-800/20 text-gray-500 cursor-not-allowed'
      }`}
      onClick={onPreviousVideo}
      disabled={!hasPreviousVideo}
      title="Previous video"
    >
      <SkipBack size={14} />
    </button>

    <button
      className="p-1.5 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white"
      onClick={seekBackward}
      title="Seek backward 5s"
    >
      <SkipBack size={14} />
    </button>

    <button
      className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white"
      onClick={togglePlay}
      disabled={isLoading}
    >
      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
    </button>

    <button
      className="p-1.5 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white"
      onClick={seekForward}
      title="Seek forward 5s"
    >
      <SkipForward size={14} />
    </button>

    <button
      className={`p-1.5 rounded-full ${
        hasNextVideo
          ? 'bg-gray-800/50 hover:bg-gray-700/50 text-white'
          : 'bg-gray-800/20 text-gray-500 cursor-not-allowed'
      }`}
      onClick={onNextVideo}
      disabled={!hasNextVideo}
      title="Next video"
    >
      <SkipForward size={14} />
    </button>
  </div>

  {/* Center time */}
  <div className="text-white text-xs mx-2">
    {VideoSurveyService.formatDuration(normalizeTime(currentTime) * 1000)} / {VideoSurveyService.formatDuration(duration * 1000)}
  </div>

  {/* Right controls */}
  <div className="flex items-center space-x-2">
    <Volume2 size={10} className="text-white" />
    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-16 accent-blue-500" />

    {/*<button onClick={() => rotateVideo('ccw')} className="p-1.5 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white">
      <RotateCcw size={14} />
    </button>
    <button onClick={() => rotateVideo('cw')} className="p-1.5 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white">
      <RotateCw size={14} />
    </button>*/}
  </div>
</div>

        </div>
      </div>
    </div>
  );
};

// Enhanced main component
export default function SurveyVideoPanel(props: SurveyVideoPanelProps) {
  const {
    open, onClose,
    availableVideos, currentVideoIndex, onChangeVideoIndex,
    currentTime, onTimeChange,
    selection, onSelectionChange,
    trackPoints = [],
    currentPosition,
    surveySummary,
  } = props;

  const clip = availableVideos[currentVideoIndex];

  // Enhanced navigation handlers
  const handlePrevious = useCallback(() => {
    if (currentVideoIndex > 0) {
      const i = currentVideoIndex - 1;
      onChangeVideoIndex(i);
      onTimeChange(availableVideos[i].startTimeStamp);
    }
  }, [currentVideoIndex, onChangeVideoIndex, onTimeChange, availableVideos]);

  const handleNext = useCallback(() => {
    if (currentVideoIndex < availableVideos.length - 1) {
      const i = currentVideoIndex + 1;
      onChangeVideoIndex(i);
      onTimeChange(availableVideos[i].startTimeStamp);
    }
  }, [currentVideoIndex, availableVideos.length, onChangeVideoIndex, onTimeChange, availableVideos]);

  // Enhanced selection handlers
  const handleSetStart = useCallback(() => {
    onSelectionChange({ ...selection, start: currentTime });
  }, [selection, currentTime, onSelectionChange]);

  const handleSetEnd = useCallback(() => {
    onSelectionChange({ ...selection, end: currentTime });
  }, [selection, currentTime, onSelectionChange]);

  const handleClearSelection = useCallback(() => {
    onSelectionChange({});
  }, [onSelectionChange]);

  // Enhanced clip duration formatting
  const clipDurationFormatted = useMemo(() => {
    if (!clip) return '0s';
    const durationMs = clip.endTimeStamp - clip.startTimeStamp;
    return VideoSurveyService.formatDuration(durationMs);
  }, [clip]);

  // Enhanced selection duration calculation
  const selectionDurationFormatted = useMemo(() => {
    if (selection.start == null || selection.end == null) return null;
    const durationMs = selection.end - selection.start;
    return VideoSurveyService.formatDuration(Math.abs(durationMs));
  }, [selection.start, selection.end]);

  // Enhanced clip info with validation
  const clipInfo = useMemo(() => {
    if (!clip) return null;
    
    return {
      currentIndex: currentVideoIndex + 1,
      totalClips: availableVideos.length,
      duration: clipDurationFormatted,
      startTime: new Date(clip.startTimeStamp).toLocaleTimeString(),
      endTime: new Date(clip.endTimeStamp).toLocaleTimeString(),
      surveyId: clip.meta?.surveyId || 'Unknown',
      videoId: clip.id
    };
  }, [clip, currentVideoIndex, availableVideos.length, clipDurationFormatted]);

  if (!open) return null;

  return (
    <aside className="w-full md:w-[280px] xl:w-[380px] h-full border-l bg-white flex flex-col shadow-lg">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800">Video Survey</h2>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-800 w-6 h-6 flex items-center justify-center rounded transition-colors"
          aria-label="Close video panel"
        >
          ✕
        </button>
      </div>

      <div className="p-3 space-y-3 flex-1 overflow-y-auto">
        {clip && availableVideos.length > 0 ? (
          <>
            {/* Enhanced Video Player */}
            <EnhancedVideoPlayer
              videoUrl={clip.videoUrl}
              currentTime={currentTime}
              onTimeUpdate={onTimeChange}
              startTime={clip.startTimeStamp}
              endTime={selection.end}
              currentPosition={currentPosition}
              trackPoints={trackPoints}
              onNextVideo={handleNext}
              onPreviousVideo={handlePrevious}
              hasNextVideo={currentVideoIndex < availableVideos.length - 1}
              hasPreviousVideo={currentVideoIndex > 0}
              className="h-64"
            />

            {/* Enhanced Clip Info */}
            {clipInfo && (
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-800 mb-2">Clip Information</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>Clip: {clipInfo.currentIndex} of {clipInfo.totalClips}</div>
                  <div>Duration: {clipInfo.duration}</div>
                  <div>Start: {clipInfo.startTime}</div>
                  <div>End: {clipInfo.endTime}</div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-xs">
                  <div>Survey ID: {clipInfo.surveyId}</div>
                  <div className="flex flex-col items-end">
                    <div>Video ID: {clipInfo.videoId}</div>
                    <div className="text-gray-600">
                      Current: {new Date(currentTime).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Selection Tools
            <div className="space-y-2">
               <div className="flex items-center gap-2 text-xs flex-wrap">
                <button 
                  className="px-3 py-2 rounded bg-green-100 hover:bg-green-200 text-green-800 transition-colors font-medium" 
                  onClick={handleSetStart}
                >
                  Set Start
                </button>
                <button 
                  className="px-3 py-2 rounded bg-red-100 hover:bg-red-200 text-red-800 transition-colors font-medium" 
                  onClick={handleSetEnd}
                >
                  Set End
                </button>
                <button 
                  className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors font-medium" 
                  onClick={handleClearSelection}
                >
                  Clear
                </button>
              </div>
              
              <div className="text-xs text-gray-600 text-right">
                Current: {new Date(currentTime).toLocaleTimeString()}
              </div>
            </div>*/}

            {/* Enhanced Selection Display */}
            {(selection.start != null || selection.end != null) && (
              <div className="p-3 bg-blue-50 rounded-lg text-xs border border-blue-200">
                <div className="font-medium text-blue-800 mb-2">Selection Window</div>
                <div className="space-y-1">
                  {selection.start != null && (
                    <div className="text-blue-700">Start: {new Date(selection.start).toLocaleTimeString()}</div>
                  )}
                  {selection.end != null && (
                    <div className="text-blue-700">End: {new Date(selection.end).toLocaleTimeString()}</div>
                  )}
                  {selectionDurationFormatted && (
                    <div className="text-blue-700 font-medium">Duration: {selectionDurationFormatted}</div>
                  )}
                  {selection.start != null && selection.end != null && clip && (
                    <div className="text-blue-600 text-xs mt-2 pt-2 border-t border-blue-200">
                      Selection covers {Math.round(((selection.end - selection.start) / (clip.endTimeStamp - clip.startTimeStamp)) * 100)}% of current clip
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Summary */}
            <div className="mt-3 p-3 border rounded-lg bg-gray-50">
              <h3 className="text-sm font-semibold mb-2 text-gray-800">Survey Summary</h3>
              {surveySummary || (
                <div className="text-xs text-gray-600 space-y-1">
                  <div>No summary available.</div>
                  <div>Total Duration: {VideoSurveyService.formatDuration(clip.endTimeStamp - clip.startTimeStamp)}</div>
                  <div>GPS Points: {trackPoints.length}</div>
                </div>
              )}
            </div>

            {/* Enhanced Instructions 
            <div className="mt-3 p-3 border rounded-lg bg-blue-50">
              <h3 className="text-sm font-semibold mb-2 text-blue-800">Enhanced Controls</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Use enhanced video controls (play, pause, seek ±5s)</li>
                <li>• Click track points on map to jump to timestamps</li>
                <li>• Rotate video with rotation controls</li>
                <li>• Create segments with Start/End selection</li>
                <li>• Navigate between clips with Prev/Next</li>
                <li>• Adjust volume with volume slider</li>
              </ul>
            </div>*/}
          </>
        ) : (
          <div className="text-sm text-gray-600 p-4 text-center">
            <div className="mb-2">No videos available for this survey.</div>
            <div className="text-xs text-gray-500">
              Make sure video survey data has been loaded and contains valid video clips.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}