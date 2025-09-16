import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { VideoSurveyService, VideoClip, TrackPoint } from './VideoSurveyService';
import { Play, Pause, SkipBack, SkipForward, Volume2, MapPin, Clock, X } from 'lucide-react';

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
}

// Enhanced Video Player optimized for split screen
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
  currentSurveyId
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const isSeekingRef = useRef<boolean>(false);
  const currentVideoUrlRef = useRef<string>('');
  const initialSyncDoneRef = useRef<boolean>(false);

  // Normalize time
  const normalizeTime = useCallback((time: number): number => {
    const videoTime = startTime ? (time - startTime) / 1000 : time / 1000;
    if (videoTime < 0) return 0;
    if (duration > 0 && videoTime > duration) return duration;
    return videoTime;
  }, [startTime, duration]);

  // Reset on video URL change
  useEffect(() => {
    if (currentVideoUrlRef.current !== videoUrl) {
      currentVideoUrlRef.current = videoUrl;
      setIsLoading(true);
      setIsPlaying(false);
      setProgress(0);
      isSeekingRef.current = false;
      initialSyncDoneRef.current = false;
    }
  }, [videoUrl]);

  // Sync external currentTime → player
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

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

  const seekForward = useCallback(() => {
    const video = videoRef.current;
    if (video && duration > 0) {
      isSeekingRef.current = true;
      const newTime = Math.min(video.currentTime + 5, duration);
      video.currentTime = newTime;
      setProgress(newTime / duration);

      const timestamp = startTime ? startTime + newTime * 1000 : newTime * 1000;
      onTimeUpdate(timestamp);

      setTimeout(() => { isSeekingRef.current = false; }, 100);
    }
  }, [duration, startTime, onTimeUpdate]);

  const seekBackward = useCallback(() => {
    const video = videoRef.current;
    if (video && duration > 0) {
      isSeekingRef.current = true;
      const newTime = Math.max(video.currentTime - 5, 0);
      video.currentTime = newTime;
      setProgress(newTime / duration);

      const timestamp = startTime ? startTime + newTime * 1000 : newTime * 1000;
      onTimeUpdate(timestamp);

      setTimeout(() => { isSeekingRef.current = false; }, 100);
    }
  }, [duration, startTime, onTimeUpdate]);

  const handleSeekBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = seekBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || duration <= 0) return;

    const rect = bar.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(1, position)) * duration;

    isSeekingRef.current = true;
    video.currentTime = newTime;
    setProgress(Math.max(0, Math.min(1, position)));

    const timestamp = startTime ? startTime + newTime * 1000 : newTime * 1000;
    onTimeUpdate(timestamp);

    setTimeout(() => { isSeekingRef.current = false; }, 100);
  }, [duration, startTime, onTimeUpdate]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    if (hasNextVideo && onNextVideo) {
      onNextVideo();
    }
  }, [hasNextVideo, onNextVideo]);

  const handleVideoError = useCallback(() => {
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  // Keep state synced with element
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
        {/* Compact Overlay with Date */}
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

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {/* Video Container - Flexible Height */}
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

        {/* Compact Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
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
            {/* Left controls - Compact */}
            <div className="flex items-center space-x-1">
              <button
                className={`p-1 rounded ${
                  hasPreviousVideo
                    ? 'bg-gray-800/50 hover:bg-gray-700/50 text-white'
                    : 'bg-gray-800/20 text-gray-500 cursor-not-allowed'
                }`}
                onClick={onPreviousVideo}
                disabled={!hasPreviousVideo}
                title="Previous video"
              >
                <SkipBack size={12} />
              </button>

              <button
                className="p-1 rounded bg-gray-800/50 hover:bg-gray-700/50 text-white"
                onClick={seekBackward}
                title="Seek backward 5s"
              >
                <SkipBack size={12} />
              </button>

              <button
                className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white"
                onClick={togglePlay}
                disabled={isLoading}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>

              <button
                className="p-1 rounded bg-gray-800/50 hover:bg-gray-700/50 text-white"
                onClick={seekForward}
                title="Seek forward 5s"
              >
                <SkipForward size={12} />
              </button>

              <button
                className={`p-1 rounded ${
                  hasNextVideo
                    ? 'bg-gray-800/50 hover:bg-gray-700/50 text-white'
                    : 'bg-gray-800/20 text-gray-500 cursor-not-allowed'
                }`}
                onClick={onNextVideo}
                disabled={!hasNextVideo}
                title="Next video"
              >
                <SkipForward size={12} />
              </button>
            </div>

            {/* Center time - Compact */}
            <div className="text-white text-xs px-2">
              {VideoSurveyService.formatDuration(normalizeTime(currentTime) * 1000)} / {VideoSurveyService.formatDuration(duration * 1000)}
            </div>

            {/* Right controls - Compact */}
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Panel Component - Optimized for Split Screen
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

  if (!open) return null;

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header - Compact */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800">Video Survey</h2>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-800 p-1 rounded transition-colors"
          aria-label="Close video panel"
        >
          <X size={16} />
        </button>
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
            />

            {/* Clip Information - Compact */}
            {clipInfo && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <div className="font-medium text-gray-800 mb-1">Clip {clipInfo.currentIndex}/{clipInfo.totalClips}</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{clipInfo.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Survey:</span>
                    <span>{clipInfo.surveyId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current:</span>
                    <span>{new Date(currentTime).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Selection Window - Compact */}
            {(selection.start != null || selection.end != null) && (
              <div className="p-2 bg-blue-50 rounded text-xs border border-blue-200">
                <div className="font-medium text-blue-800 mb-1">Selection</div>
                <div className="space-y-1">
                  {selection.start != null && (
                    <div className="flex justify-between text-blue-700">
                      <span>Start:</span>
                      <span>{new Date(selection.start).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {selection.end != null && (
                    <div className="flex justify-between text-blue-700">
                      <span>End:</span>
                      <span>{new Date(selection.end).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {selectionDurationFormatted && (
                    <div className="flex justify-between text-blue-700 font-medium">
                      <span>Duration:</span>
                      <span>{selectionDurationFormatted}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Survey Summary - Compact */}
            <div className="p-2 border rounded bg-gray-50">
              <h3 className="text-xs font-semibold mb-1 text-gray-800">Survey Summary</h3>
              {surveySummary || (
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Survey ID:</span>
                    <span>{clip?.meta?.surveyId || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GPS Points:</span>
                    <span>{currentSurveyTrackPoints.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total GPS:</span>
                    <span>{trackPoints.length}</span>
                  </div>
                  {allSurveyIds.length > 1 && (
                    <div className="pt-1 mt-1 border-t border-gray-200">
                      <div className="font-medium mb-1">Available Surveys:</div>
                      <div className="text-gray-500 text-xs break-words">
                        {allSurveyIds.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600 p-4 text-center">
            <div className="mb-2">No videos available for this survey.</div>
            <div className="text-xs text-gray-500">
              Make sure video survey data has been loaded and contains valid video clips.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}