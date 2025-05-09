import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

type UnderGroundSurveyData = {
  id: string;
  latitude: string;
  longitude: string;
  event_type: string;
  execution_modality: string;
  videoUrl?: string;
  start_photos: string[];
  end_photos: string[];
  jointChamberUrl: string;
  created_at: string;
  video_duration?: number;
};

interface VideoPlayerProps {
  videoSegment: UnderGroundSurveyData[];
  selectedvideo: object | null;
  baseUrl: string;
  startTime?: number | null;
  endTime?: number | null;
  onTimeUpdate?: (time: number,duration:number, position: { lat: number, lng: number }) => void;
  onDurationChange?: (duration: number, videoIndex: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoSegment,
  selectedvideo,
  baseUrl,
  startTime = null,
  endTime = null,
  onTimeUpdate,
  onDurationChange
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hasSetStartTime = useRef(false);

  const currentVideo = videoSegment[currentVideoIndex];
  const videoUrl = currentVideo?.videoUrl ? `${baseUrl}${currentVideo.videoUrl.replace(/(^"|"$)/g, '')}` : '';

  // Effect to handle video initialization
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Effect to handle video changing
  useEffect(() => {
    // Reset state when video changes
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    hasSetStartTime.current = false;

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  }, [currentVideoIndex, videoSegment]);

  // Effect to set startTime when video metadata is loaded
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    hasSetStartTime.current = false;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.load();

      const handleCanPlay = () => {
        if (!hasSetStartTime.current && startTime !== null) {
          videoRef.current!.currentTime = startTime;
          hasSetStartTime.current = true;
        }

        videoRef.current?.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error("Play error:", err);
          setIsPlaying(false);
        });

        videoRef.current?.removeEventListener('canplay', handleCanPlay);
      };

      videoRef.current.addEventListener('canplay', handleCanPlay);
    }
  }, [currentVideoIndex, videoSegment, startTime]);

  // Handle time updates to track progress
  const calculatePosition = (time: number) => {
    if (!videoSegment || videoSegment.length === 0) return null;

    const startPos = {
      lat: parseFloat(videoSegment[currentVideoIndex].latitude),
      lng: parseFloat(videoSegment[currentVideoIndex].longitude)
    };

    const endPos = {
      lat: parseFloat(videoSegment[currentVideoIndex + 1]?.latitude || videoSegment[currentVideoIndex].latitude),
      lng: parseFloat(videoSegment[currentVideoIndex + 1]?.longitude || videoSegment[currentVideoIndex].longitude)
    };

    // Linear interpolation between points
    const progress = Math.min(time / (duration || 1), 1);
    return {
      lat: startPos.lat + (endPos.lat - startPos.lat) * progress,
      lng: startPos.lng + (endPos.lng - startPos.lng) * progress
    };
  };


  
  

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
     
      const videoDuration = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / videoDuration) * 100);

      const position = calculatePosition(current);
      if (position && onTimeUpdate) {
        onTimeUpdate(current,duration,position,);
      }

      // Pause at endTime if specified
      if (endTime !== null && current >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
      }

    }
  };

  // Handle metadata loading to get video duration
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);

      // Update the parent component about the video duration
      if (onDurationChange) {
        onDurationChange(videoDuration, currentVideoIndex);
      }
    }
  };

  // Handle video ending
  const handleVideoEnded = () => {
    setIsPlaying(false);

    // if (currentVideoIndex < videoSegment.length - 1) {
    //   setCurrentVideoIndex(currentVideoIndex + 1);
    //   setIsPlaying(true);
    // } else {
    //   setIsPlaying(false);
    // }
  };

  // Handle progress bar clicks to seek video
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newTime = clickPosition * videoRef.current.duration;

      // Make sure we respect the endTime constraint
      if (endTime !== null && newTime > endTime) {
        videoRef.current.currentTime = endTime;
      } else {
        videoRef.current.currentTime = newTime;
      }

      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  // Navigation handlers
  const handlePrevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < videoSegment.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  // Helper to format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      {videoUrl ? (
        <>
          <div className="relative bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-auto"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnded}
            />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs truncate">
                {currentVideo?.event_type} - ID: {currentVideo?.id}
              </p>
            </div>
          </div>

          <div className="p-3">
            {/* Video range indicator */}
            {startTime !== null && (
              <div className="text-xs text-blue-600 mb-1">
                Playing from: {formatTime(startTime)}
                {endTime !== null ? ` to ${formatTime(endTime)}` : ''}
              </div>
            )}

            {/* Progress bar */}
            <div
              ref={progressBarRef}
              className="relative h-2 bg-gray-200 rounded-full cursor-pointer mb-2"
              onClick={handleProgressBarClick}
            >
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>

              {/* Show end time marker if available */}
              {endTime !== null && duration > 0 && (
                <div
                  className="absolute top-0 h-full w-0.5 bg-red-500"
                  style={{ left: `${(endTime / duration) * 100}%` }}
                ></div>
              )}
            </div>

            {/* Time display */}
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Player controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* <button
                  onClick={handlePrevVideo}
                  disabled={currentVideoIndex === 0}
                  className={`p-2 rounded-full transition-colors ${currentVideoIndex === 0 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <SkipBack size={16} />
                </button> */}

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                {/* <button
                  onClick={handleNextVideo}
                  disabled={currentVideoIndex === videoSegment.length - 1}
                  className={`p-2 rounded-full transition-colors ${currentVideoIndex === videoSegment.length - 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <SkipForward size={16} />
                </button> */}
              </div>

              {/* Video counter */}
              <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                {currentVideoIndex + 1} of {videoSegment.length}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 text-center text-gray-500">
          No playable video in this segment
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;