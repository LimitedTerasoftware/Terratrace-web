import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, RotateCw, MapPin, Crosshair, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatDuration, formatTimestamp } from './timeUtils';
import { MapPosition } from './types';

interface VideoPlayerProps {
  videoUrl: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  startTime?: number;
  endTime?: number;
  className?: string;
  currentPosition?: { lat: number; lng: number; accuracy?: number } | null;
  TrackPoints:MapPosition[]
  onNextVideo?: () => void;
  onPreviousVideo?: () => void;
  hasNextVideo?: boolean;
  hasPreviousVideo?: boolean;
  isPlayingSegment?: boolean;

}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  currentTime,
  onTimeUpdate,
  startTime,
  endTime,
  className = '',
  currentPosition,
  TrackPoints,
  onNextVideo,
  onPreviousVideo,
  hasNextVideo = false,
  hasPreviousVideo = false,
  isPlayingSegment = false,

}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  // Sync video with external currentTime
  useEffect(() => {
    const video = videoRef.current;
    if (video && Math.abs(video.currentTime - normalizeTime(currentTime)) > 0.5) {
      video.currentTime = normalizeTime(currentTime);
    }
  }, [currentTime]);

  // Normalize time to be within video bounds and adjust by startTime if provided
  const normalizeTime = (time: number): number => {
    // Convert from timestamp to video time if startTime is provided
    const videoTime = startTime ? (time - startTime) / 1000 : time;

    if (videoTime < 0) return 0;
    if (duration > 0 && videoTime > duration) return duration;
    return videoTime;
  };

  // Handle when video metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      if (isPlayingSegment) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !hasStartedPlaying) return;
    const currentVideoTime = videoRef.current.currentTime;
    setProgress(currentVideoTime / duration);

    const timestamp = startTime
      ? startTime + currentVideoTime * 1000
      : currentVideoTime;

    onTimeUpdate(timestamp);
    if (endTime && startTime) {
      const stopTime = (endTime - startTime) / 1000;
      if (currentVideoTime >= stopTime) {
        video.pause();
        setIsPlaying(false);
        setHasStartedPlaying(false);

        return;
      }
    }


  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => {
          setIsPlaying(true);
          setHasStartedPlaying(true);
        })
        .catch((err) => {
          console.warn("Play failed:", err);
          setIsPlaying(false);
          setHasStartedPlaying(false);
        });
    }
  };

  // Seek forward 5 seconds
  const seekForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, duration);
    }
  };

  // Seek backward 5 seconds
  const seekBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
    }
  };

  // Handle click on seek bar
  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || !videoRef.current) return;

    const rect = seekBarRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newTime = position * duration;

    videoRef.current.currentTime = newTime;
    setProgress(position);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };
  const rotateVideo = (direction: 'cw' | 'ccw') => {
    const newRotation = direction === 'cw'
      ? (rotation + 90) % 360
      : (rotation - 90 + 360) % 360;
    setRotation(newRotation);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);

    const handleCanPlay = () => {
      setIsLoading(false);
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasStartedPlaying(true);
        })
        .catch((err) => {
          console.warn("Autoplay failed:", err);
          setIsPlaying(false);
          setHasStartedPlaying(false);
        });
    };
    video.addEventListener("canplay", handleCanPlay);
    return () => video.removeEventListener("canplay", handleCanPlay);
  }, [videoUrl, isPlayingSegment]);

  const handleVideoEnded = () => {
    const currentVideoTime = videoRef.current?.currentTime || 0;

    if (endTime && startTime && (startTime + currentVideoTime * 1000) >= endTime) {
      videoRef.current?.pause();
      return;
    }
    if (hasNextVideo && onNextVideo) {
      onNextVideo();
    }
  };
const areCoordsEqual = (a: number, b: number) => Math.abs(a - b) < 0.00001;


  return (
    <div className={`rounded-lg  bg-gray-900 shadow-lg ${className}`}>
      <div className="relative  w-full h-full flex flex-col overflow-hidden">
        {/* Position overlay */}
        {currentPosition && (
          <div className="absolute top-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm z-10 flex items-center justify-between">
            <div className="flex items-center">
              <MapPin size={16} className="mr-2" />
            {
              (() => {
                const matchedPoint = TrackPoints.find(
                  p => areCoordsEqual(p.lat, currentPosition.lat) && areCoordsEqual(p.lng, currentPosition.lng)
                );

                return matchedPoint && (
                  <span>
                    {matchedPoint.lat.toFixed(6)}°, {matchedPoint.lng.toFixed(6)}°
                  </span>
                );
              })()
            }

            </div>
            <div className="flex items-center ml-4">
              <Clock size={16} className="mr-2" />
              <span>{formatTimestamp(currentTime)}</span>
            </div>
          </div>
        )}
        {isLoading && (
          <div className='absolute inset-0 bg-black/50 flex items-center justify-center z-20'>
            <Loader2 className='w-12 h-12 text-white animate-spin' />
          </div>
        )}

        {/* Video container with rotation */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">

          <div style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease'
          }}
            className="max-h-full max-w-full">
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-h-full max-w-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleVideoEnded}
            />
          </div>
        </div>

        {/* Video controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Seek bar */}
          <div
            ref={seekBarRef}
            className="h-1 bg-gray-600 rounded-full mb-3 cursor-pointer"
            onClick={handleSeekBarClick}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Left controls: Playback */}
            <div className="flex items-center space-x-3">
              <button
                className={`p-2 rounded-full ${hasPreviousVideo
                    ? 'bg-gray-800/50 hover:bg-gray-700/50 text-white'
                    : 'bg-gray-800/20 text-gray-500 cursor-not-allowed'
                  }`}
                onClick={onPreviousVideo}
                disabled={!hasPreviousVideo}
                title="Previous video"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                className="p-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button
                className={`p-2 rounded-full ${hasNextVideo
                    ? 'bg-gray-800/50 hover:bg-gray-700/50 text-white'
                    : 'bg-gray-800/20 text-gray-500 cursor-not-allowed'
                  }`}
                onClick={onNextVideo}
                disabled={!hasNextVideo}
                title="Next video"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Center: Time display */}
            <div className="text-white text-sm">
              {formatDuration(normalizeTime(currentTime) * 1000)} / {formatDuration(duration * 1000)}
            </div>

            {/* Right controls: Volume and Rotation */}
            <div className="flex items-center space-x-4">
              {/* Volume control */}
              <div className="flex items-center w-24">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Rotation controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => rotateVideo('ccw')}
                  className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white"
                  title="Rotate counterclockwise"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => rotateVideo('cw')}
                  className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white"
                  title="Rotate clockwise"
                >
                  <RotateCw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default VideoPlayer;