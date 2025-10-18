import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { VideoSurveyService, VideoClip, TrackPoint } from './VideoSurveyService';
import { Play, Pause, SkipBack, SkipForward, Volume2, MapPin, Clock, X, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

interface SurveyVideoPanelProps {
  open: boolean;
  onClose: () => void;
  availableVideos: VideoClip[];
  currentVideoIndex: number;
  onChangeVideoIndex: (i: number) => void;
  currentTime: number; // ms
  onTimeChange: (t: number) => void;
  selection: { start?: number; end?: number };
  onSelectionChange: (sel: { start?: number; end?: number }) => void;
  trackPoints: TrackPoint[];
  currentPosition?: { lat: number; lng: number };
  surveySummary?: React.ReactNode;
  landmarkPauseEnabled?: boolean;
  showingLandmark?: boolean;
  onLandmarkPause?: () => void;
  shouldResumeAfterLandmark?: boolean;
  onResumeComplete?: () => void;
}

// Enhanced Video Player with landmark detection integration
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
  currentSurveyId?: string;
  landmarkPauseEnabled?: boolean;
  showingLandmark?: boolean;
  onLandmarkPause?: () => void;
  shouldResumeAfterLandmark?: boolean;
  onResumeComplete?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onPanUp?: () => void;
  onPanDown?: () => void;
  onPanLeft?: () => void;
  onPanRight?: () => void;
  onResetView?: () => void;
  onTransformChange?: (transform: { scale: number; translateX: number; translateY: number }) => void;
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
  className = '',
  landmarkPauseEnabled = false,
  showingLandmark = false,
  onLandmarkPause,
  shouldResumeAfterLandmark = false,
  onResumeComplete,
  currentSurveyId,
  onZoomIn,
  onZoomOut,
  onPanUp,
  onPanDown,
  onPanLeft,
  onPanRight,
  onResetView,
  onTransformChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [wasPlayingBeforeLandmark, setWasPlayingBeforeLandmark] = useState(false);

  // Video transform state for zoom/pan functionality
  const [videoTransform, setVideoTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });

  const isSeekingRef = useRef<boolean>(false);
  const currentVideoUrlRef = useRef<string>('');
  const initialSyncDoneRef = useRef<boolean>(false);

  // Apply transform to video element
  useEffect(() => {
    if (videoRef.current) {
      const { scale, translateX, translateY } = videoTransform;
      videoRef.current.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
      videoRef.current.style.transformOrigin = 'center center';
      videoRef.current.style.transition = 'transform 0.2s ease';
    }
  }, [videoTransform]);

  // Notify parent of transform changes
  useEffect(() => {
    onTransformChange?.(videoTransform);
  }, [videoTransform, onTransformChange]);

  // Reset transform when video changes
  useEffect(() => {
    if (currentVideoUrlRef.current !== videoUrl) {
      setVideoTransform({ scale: 1, translateX: 0, translateY: 0 });
      currentVideoUrlRef.current = videoUrl;
    }
  }, [videoUrl]);

  // Expose control functions to parent through global functions
  useEffect(() => {
    window.videoPlayerZoomIn = () => {
      setVideoTransform(prev => ({
        ...prev,
        scale: Math.min(prev.scale * 1.2, 3)
      }));
    };

    window.videoPlayerZoomOut = () => {
      setVideoTransform(prev => ({
        ...prev,
        scale: Math.max(prev.scale / 1.2, 0.5)
      }));
    };

    window.videoPlayerPanUp = () => {
      setVideoTransform(prev => ({
        ...prev,
        translateY: prev.translateY - 30
      }));
    };

    window.videoPlayerPanDown = () => {
      setVideoTransform(prev => ({
        ...prev,
        translateY: prev.translateY + 30
      }));
    };

    window.videoPlayerPanLeft = () => {
      setVideoTransform(prev => ({
        ...prev,
        translateX: prev.translateX - 30
      }));
    };

    window.videoPlayerPanRight = () => {
      setVideoTransform(prev => ({
        ...prev,
        translateX: prev.translateX + 30
      }));
    };

    window.videoPlayerResetView = () => {
      setVideoTransform({ scale: 1, translateX: 0, translateY: 0 });
    };

    return () => {
      delete window.videoPlayerZoomIn;
      delete window.videoPlayerZoomOut;
      delete window.videoPlayerPanUp;
      delete window.videoPlayerPanDown;
      delete window.videoPlayerPanLeft;
      delete window.videoPlayerPanRight;
      delete window.videoPlayerResetView;
    };
  }, []);

  const normalizeTime = useCallback((time: number): number => {
    const videoTime = startTime ? (time - startTime) / 1000 : time / 1000;
    if (videoTime < 0) return 0;
    if (duration > 0 && videoTime > duration) return duration;
    return videoTime;
  }, [startTime, duration]);

  // Reset state on video URL change
  useEffect(() => {
    if (currentVideoUrlRef.current !== videoUrl) {
      setIsLoading(true);
      setIsPlaying(false);
      setProgress(0);
      setWasPlayingBeforeLandmark(false);
      isSeekingRef.current = false;
      initialSyncDoneRef.current = false;
    }
  }, [videoUrl]);

  // Sync external currentTime to video player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isSeekingRef.current || duration <= 0) return;

    const targetTime = normalizeTime(currentTime);
    const timeDiff = Math.abs(video.currentTime - targetTime);

    const shouldSync = !initialSyncDoneRef.current || timeDiff > 0.5;
    if (!shouldSync) return;

    initialSyncDoneRef.current = true;

    if (timeDiff <= 0.05) {
      setProgress(targetTime / duration);
      isSeekingRef.current = false;
      return;
    }

    isSeekingRef.current = true;
    video.currentTime = targetTime;
    setProgress(targetTime / duration);

    const fallback = setTimeout(() => {
      isSeekingRef.current = false;
    }, 400);

    const handleSeeked = () => {
      isSeekingRef.current = false;
      clearTimeout(fallback);
      video.removeEventListener('seeked', handleSeeked);
    };
    video.addEventListener('seeked', handleSeeked);
  }, [currentTime, normalizeTime, duration]);

  // Enhanced landmark pause handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !landmarkPauseEnabled) return;
    
    if (showingLandmark) {
      // Landmark detected - pause video if it's playing
      if (!video.paused) {
        setWasPlayingBeforeLandmark(true);
        video.pause();
        setIsPlaying(false);
        onLandmarkPause?.();
      }
    } else {
      // No landmark showing - reset the flag but don't auto-resume
      if (wasPlayingBeforeLandmark && !showingLandmark) {
        setWasPlayingBeforeLandmark(false);
      }
    }
  }, [showingLandmark, landmarkPauseEnabled, onLandmarkPause, wasPlayingBeforeLandmark]);

  // Enhanced resume handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isLoading) return;
    
    // Only resume if explicitly told to resume after landmark AND video is paused AND no landmark showing
    if (shouldResumeAfterLandmark && video.paused && !showingLandmark) {
      
      video.play()
        .then(() => {
          setIsPlaying(true);
          setWasPlayingBeforeLandmark(false);
          onResumeComplete?.();
        })
        .catch((error) => {
          console.error('Failed to resume video:', error);
          setIsPlaying(false);
          onResumeComplete?.(); // Signal completion even on error
        });
    }
  }, [shouldResumeAfterLandmark, showingLandmark, isLoading, onResumeComplete]);

  // Event handlers
  const handleLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
    if (el) {
      setDuration(el.duration);
      setIsLoading(false);
      initialSyncDoneRef.current = false;
      isSeekingRef.current = false;
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || isSeekingRef.current) return;

    const currentVideoTime = video.currentTime;
    setProgress(duration > 0 ? currentVideoTime / duration : 0);

    const timestamp = startTime ? startTime + currentVideoTime * 1000 : currentVideoTime * 1000;
    onTimeUpdate(timestamp);

    if (endTime && timestamp >= endTime) {
      video.pause();
      setIsPlaying(false);
    }
  }, [duration, startTime, endTime, onTimeUpdate]);

  // Enhanced play/pause toggle to handle landmark state
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Don't allow manual play/pause when landmark is showing
    if (showingLandmark) {
      console.log('Play/pause blocked - landmark modal is open');
      return;
    }

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setWasPlayingBeforeLandmark(false);
    } else {
      video.play()
        .then(() => {
          setIsPlaying(true);
          setWasPlayingBeforeLandmark(false);
        })
        .catch(() => setIsPlaying(false));
    }
  }, [isPlaying, showingLandmark]);

  const seekForward = useCallback(() => {
    const video = videoRef.current;
    if (video && duration > 0 && !showingLandmark) {
      isSeekingRef.current = true;
      const newTime = Math.min(video.currentTime + 5, duration);
      video.currentTime = newTime;
      setProgress(newTime / duration);

      const timestamp = startTime ? startTime + newTime * 1000 : newTime * 1000;
      onTimeUpdate(timestamp);

      setTimeout(() => { isSeekingRef.current = false; }, 100);
    }
  }, [duration, startTime, onTimeUpdate, showingLandmark]);

  const seekBackward = useCallback(() => {
    const video = videoRef.current;
    if (video && duration > 0 && !showingLandmark) {
      isSeekingRef.current = true;
      const newTime = Math.max(video.currentTime - 5, 0);
      video.currentTime = newTime;
      setProgress(newTime / duration);

      const timestamp = startTime ? startTime + newTime * 1000 : newTime * 1000;
      onTimeUpdate(timestamp);

      setTimeout(() => { isSeekingRef.current = false; }, 100);
    }
  }, [duration, startTime, onTimeUpdate, showingLandmark]);

  const handleSeekBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = seekBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || duration <= 0 || showingLandmark) return;

    const rect = bar.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(1, position)) * duration;

    isSeekingRef.current = true;
    video.currentTime = newTime;
    setProgress(Math.max(0, Math.min(1, position)));

    const timestamp = startTime ? startTime + newTime * 1000 : newTime * 1000;
    onTimeUpdate(timestamp);

    setTimeout(() => { isSeekingRef.current = false; }, 100);
  }, [duration, startTime, onTimeUpdate, showingLandmark]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setWasPlayingBeforeLandmark(false);
    if (hasNextVideo && onNextVideo) {
      onNextVideo();
    }
  }, [hasNextVideo, onNextVideo]);

  const handleVideoError = useCallback(() => {
    setIsLoading(false);
    setIsPlaying(false);
    setWasPlayingBeforeLandmark(false);
  }, []);

  // Keep state synced with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoUrl]);

  const currentCoordinates = useMemo(() => {
    if (!currentPosition || !trackPoints.length) return null;
    return {
      lat: currentPosition.lat.toFixed(6),
      lng: currentPosition.lng.toFixed(6)
    };
  }, [currentPosition, trackPoints]);

  return (
    <div className={`rounded-lg bg-gray-900 shadow-lg ${className}`}>
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {/* Coordinates and Time Overlay */}
        {currentCoordinates && (
          <div className="absolute top-2 left-2 right-2 bg-black/70 text-white p-1.5 rounded text-xs z-10">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center space-x-2 min-w-0">
                <MapPin size={10} className="flex-shrink-0" />
                <span className="truncate">{currentCoordinates.lat}°, {currentCoordinates.lng}°</span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="flex items-center space-x-1">
                  <Clock size={10} />
                  <span>{new Date(currentTime).toLocaleTimeString()}</span>
                </div>
                {startTime && (
                  <span className="text-gray-300 text-xs">
                    {new Date(startTime).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Video Container */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black min-h-[240px] max-h-[400px]">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            preload="metadata"
            playsInline
          />
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}


        {/* Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
          {/* Seek bar */}
          <div
            ref={seekBarRef}
            className={`h-1 bg-gray-600 rounded-full mb-2 ${showingLandmark ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            onClick={handleSeekBarClick}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Left controls */}
            <div className="flex items-center space-x-1">
              <button
                className={`p-1 rounded ${
                  hasPreviousVideo && !showingLandmark
                    ? 'bg-gray-800/50 hover:bg-gray-700/50 text-white'
                    : 'bg-gray-800/20 text-gray-500 cursor-not-allowed'
                }`}
                onClick={onPreviousVideo}
                disabled={!hasPreviousVideo || showingLandmark}
                title="Previous video"
              >
                <SkipBack size={12} />
              </button>

              <button
                className={`p-1 rounded ${
                  showingLandmark 
                    ? 'bg-gray-800/20 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800/50 hover:bg-gray-700/50 text-white'
                }`}
                onClick={seekBackward}
                disabled={showingLandmark}
                title="Seek backward 5s"
              >
                <SkipBack size={12} />
              </button>

              <button
                className={`p-1.5 rounded-full ${
                  showingLandmark
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
                onClick={togglePlay}
                disabled={isLoading || showingLandmark}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>

              <button
                className={`p-1 rounded ${
                  showingLandmark 
                    ? 'bg-gray-800/20 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800/50 hover:bg-gray-700/50 text-white'
                }`}
                onClick={seekForward}
                disabled={showingLandmark}
                title="Seek forward 5s"
              >
                <SkipForward size={12} />
              </button>

              <button
                className={`p-1 rounded ${
                  hasNextVideo && !showingLandmark
                    ? 'bg-gray-800/50 hover:bg-gray-700/50 text-white'
                    : 'bg-gray-800/20 text-gray-500 cursor-not-allowed'
                }`}
                onClick={onNextVideo}
                disabled={!hasNextVideo || showingLandmark}
                title="Next video"
              >
                <SkipForward size={12} />
              </button>
            </div>

            {/* Center time display */}
            <div className="text-white text-xs px-2">
              {VideoSurveyService.formatDuration(normalizeTime(currentTime) * 1000)} / {VideoSurveyService.formatDuration(duration * 1000)}
            </div>

            {/* Right controls */}
            <div className="flex items-center space-x-1">
              <Volume2 size={10} className="text-white" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-12 accent-blue-500"
                disabled={showingLandmark}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Panel Component
export default function SurveyVideoPanel(props: SurveyVideoPanelProps) {
  const {
    open, onClose,
    availableVideos, currentVideoIndex, onChangeVideoIndex,
    currentTime, onTimeChange,
    selection, onSelectionChange,
    trackPoints = [],
    currentPosition,
    surveySummary,
    landmarkPauseEnabled = false,
    showingLandmark = false,
    onLandmarkPause,
    shouldResumeAfterLandmark = false,
    onResumeComplete
  } = props;

  const [videoTransform, setVideoTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });

  const clip = availableVideos[currentVideoIndex];

  // Survey-aware track points filtering
  const currentSurveyTrackPoints = useMemo(() => {
    if (!clip?.meta?.surveyId) return trackPoints;
    return trackPoints.filter(point => point.surveyId === clip.meta.surveyId);
  }, [trackPoints, clip?.meta?.surveyId]);

  const allSurveyIds = useMemo(() => {
    const surveyIds = new Set(trackPoints.map(point => point.surveyId).filter(Boolean));
    return Array.from(surveyIds);
  }, [trackPoints]);

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

  const clipDurationFormatted = useMemo(() => {
    if (!clip) return '0s';
    const durationMs = clip.endTimeStamp - clip.startTimeStamp;
    return VideoSurveyService.formatDuration(durationMs);
  }, [clip]);

  const selectionDurationFormatted = useMemo(() => {
    if (selection.start == null || selection.end == null) return null;
    const durationMs = selection.end - selection.start;
    return VideoSurveyService.formatDuration(Math.abs(durationMs));
  }, [selection.start, selection.end]);

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

  // Check if transform is active (not default values)
  const isTransformActive = videoTransform.scale !== 1 || videoTransform.translateX !== 0 || videoTransform.translateY !== 0;

  if (!open) return null;

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header with Video Controls */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800">Video Survey</h2>
        <div className="flex items-center space-x-2">
          {/* Video Transform Controls */}
          <div className="flex items-center space-x-1 border border-gray-300 rounded px-1 bg-white">
            <button
              onClick={() => window.videoPlayerZoomOut?.()}
              className="p-1 rounded hover:bg-gray-100 text-gray-700 transition-colors"
              title="Zoom Out"
              disabled={showingLandmark}
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={() => window.videoPlayerZoomIn?.()}
              className="p-1 rounded hover:bg-gray-100 text-gray-700 transition-colors"
              title="Zoom In"
              disabled={showingLandmark}
            >
              <ZoomIn size={14} />
            </button>
            
            <div className="w-px h-4 bg-gray-300 mx-1" />
            
            <button
              onClick={() => window.videoPlayerPanUp?.()}
              className="p-1 rounded hover:bg-gray-100 text-gray-700 transition-colors"
              title="Pan Up"
              disabled={showingLandmark}
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => window.videoPlayerPanLeft?.()}
              className="p-1 rounded hover:bg-gray-100 text-gray-700 transition-colors"
              title="Pan Left"
              disabled={showingLandmark}
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={() => window.videoPlayerPanDown?.()}
              className="p-1 rounded hover:bg-gray-100 text-gray-700 transition-colors"
              title="Pan Down"
              disabled={showingLandmark}
            >
              <ArrowDown size={14} />
            </button>
            <button
              onClick={() => window.videoPlayerPanRight?.()}
              className="p-1 rounded hover:bg-gray-100 text-gray-700 transition-colors"
              title="Pan Right"
              disabled={showingLandmark}
            >
              <ArrowRight size={14} />
            </button>
            
            <div className="w-px h-4 bg-gray-300 mx-1" />
            
            <button
              onClick={() => window.videoPlayerResetView?.()}
              className="p-1 rounded hover:bg-gray-100 text-gray-700 transition-colors"
              title="Reset View"
              disabled={showingLandmark}
            >
              <RotateCcw size={14} />
            </button>
          </div>
          
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 p-1 rounded transition-colors"
            aria-label="Close video panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {clip && availableVideos.length > 0 ? (
          <div className="space-y-3 p-3">
            {/* Video Player */}
            <EnhancedVideoPlayer
              videoUrl={clip.videoUrl}
              currentTime={currentTime}
              onTimeUpdate={onTimeChange}
              startTime={clip.startTimeStamp}
              endTime={selection.end}
              currentPosition={currentPosition}
              trackPoints={currentSurveyTrackPoints}
              onNextVideo={handleNext}
              onPreviousVideo={handlePrevious}
              hasNextVideo={currentVideoIndex < availableVideos.length - 1}
              hasPreviousVideo={currentVideoIndex > 0}
              className="w-full"
              currentSurveyId={clip.meta?.surveyId}
              landmarkPauseEnabled={landmarkPauseEnabled}
              showingLandmark={showingLandmark}
              onLandmarkPause={onLandmarkPause}
              shouldResumeAfterLandmark={shouldResumeAfterLandmark}
              onResumeComplete={onResumeComplete}
              onZoomIn={() => {}}
              onZoomOut={() => {}}
              onPanUp={() => {}}
              onPanDown={() => {}}
              onPanLeft={() => {}}
              onPanRight={() => {}}
              onResetView={() => {}}
              onTransformChange={setVideoTransform}
            />

            {/* Transform Info Display - appears below video when active */}
            {isTransformActive && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded text-sm">
                <div className="flex items-center justify-center space-x-4">
                  <span className="font-medium">Zoom: {Math.round(videoTransform.scale * 100)}%</span>
                  {(videoTransform.translateX !== 0 || videoTransform.translateY !== 0) && (
                    <span className="font-medium">Pan: {Math.round(videoTransform.translateX)}, {Math.round(videoTransform.translateY)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Landmark Status Indicator */}
            {landmarkPauseEnabled && showingLandmark && (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 px-3 py-2 rounded text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Landmark detected - Video paused</span>
                </div>
                <div className="text-xs text-orange-600 mt-1 text-center">
                  Check the landmark modal for details
                </div>
              </div>
            )}

            {/* Clip Information Panel */}
            {clipInfo && (
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border">
                <div className="font-medium text-gray-800 mb-2">Clip {clipInfo.currentIndex}/{clipInfo.totalClips}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{clipInfo.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Survey:</span>
                    <span className="font-medium">{clipInfo.surveyId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Start:</span>
                    <span>{clipInfo.startTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>End:</span>
                    <span>{clipInfo.endTime}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span>Current:</span>
                    <span className="font-medium">{new Date(currentTime).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Selection Information Panel */}
            {(selection.start != null || selection.end != null) && (
              <div className="p-3 bg-blue-50 rounded text-xs border border-blue-200">
                <div className="font-medium text-blue-800 mb-2">Selection Active</div>
                <div className="space-y-1">
                  {selection.start != null && (
                    <div className="flex justify-between text-blue-700">
                      <span>Start:</span>
                      <span className="font-medium">{new Date(selection.start).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {selection.end != null && (
                    <div className="flex justify-between text-blue-700">
                      <span>End:</span>
                      <span className="font-medium">{new Date(selection.end).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {selectionDurationFormatted && (
                    <div className="flex justify-between text-blue-700 font-medium border-t border-blue-200 pt-1">
                      <span>Duration:</span>
                      <span>{selectionDurationFormatted}</span>
                    </div>
                  )}
                </div>
                {selection.start && selection.end && (
                  <div className="mt-2 text-blue-600 text-xs">
                    Click on map to modify selection points
                  </div>
                )}
              </div>
            )}

            {/* Survey Summary Panel */}
            <div className="p-3 border rounded bg-gray-50">
              <h3 className="text-xs font-semibold mb-2 text-gray-800">Survey Summary</h3>
              {surveySummary || (
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex justify-between">
                      <span>Survey ID:</span>
                      <span className="font-medium">{clip?.meta?.surveyId || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GPS Points:</span>
                      <span className="font-medium">{currentSurveyTrackPoints.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total GPS:</span>
                      <span className="font-medium">{trackPoints.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Block ID:</span>
                      <span className="font-medium">{clip?.meta?.blockId || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {clip?.meta?.area_type && (
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span>Area Type:</span>
                      <span className="font-medium">{clip.meta.area_type}</span>
                    </div>
                  )}
                  
                  {clip?.meta?.side_type && (
                    <div className="flex justify-between">
                      <span>Side Type:</span>
                      <span className="font-medium">{clip.meta.side_type}</span>
                    </div>
                  )}
                  
                  {allSurveyIds.length > 1 && (
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <div className="font-medium mb-1 text-gray-700">Available Surveys ({allSurveyIds.length}):</div>
                      <div className="text-gray-500 text-xs break-words max-h-16 overflow-y-auto">
                        {allSurveyIds.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Video Navigation Panel */}
            <div className="p-3 border rounded bg-gray-50">
              <h3 className="text-xs font-semibold mb-2 text-gray-800">Video Navigation</h3>
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentVideoIndex === 0 || showingLandmark}
                  className={`px-3 py-1 text-xs rounded ${
                    currentVideoIndex === 0 || showingLandmark
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  ← Previous
                </button>
                
                <div className="text-xs text-gray-600 px-2">
                  {currentVideoIndex + 1} of {availableVideos.length}
                </div>
                
                <button
                  onClick={handleNext}
                  disabled={currentVideoIndex === availableVideos.length - 1 || showingLandmark}
                  className={`px-3 py-1 text-xs rounded ${
                    currentVideoIndex === availableVideos.length - 1 || showingLandmark
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Landmark Detection Settings 
            {landmarkPauseEnabled && (
              <div className="p-3 border rounded bg-green-50 border-green-200">
                <h3 className="text-xs font-semibold mb-2 text-green-800">Landmark Detection Active</h3>
                <div className="text-xs text-green-700 space-y-1">
                  <div>• Video will pause when landmarks are detected</div>
                  <div>• GPS coordinates are matched precisely</div>
                  <div>• Only visible landmark categories are detected</div>
                  <div>• Use Continue/Close buttons in modal to proceed</div>
                </div>
              </div>
            )}*/}
          </div>
        ) : (
          <div className="text-sm text-gray-600 p-6 text-center">
            <div className="mb-3">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <Play size={24} className="text-gray-400" />
              </div>
              <div className="font-medium text-gray-800 mb-2">No Videos Available</div>
              <div className="text-xs text-gray-500 leading-relaxed">
                Make sure video survey data has been loaded and contains valid video clips.
                Check that the selected area has survey data with video recordings.
              </div>
            </div>
            
            {trackPoints.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <div className="text-xs text-blue-800">
                  <div className="font-medium mb-1">GPS Data Available</div>
                  <div>Found {trackPoints.length} track points, but no video clips.</div>
                  <div className="mt-1">Check if video files are properly uploaded and processed.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}