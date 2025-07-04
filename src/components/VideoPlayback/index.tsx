import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import MapView from './MapView';
import ImageViewer from './ImageViewer';
import { UnderGroundSurveyData, MapPosition, SegmentSelection } from './types';
import { extractVideoRecordData, getPositionAtTime } from './dataTransformUtils';
import { Camera, MapPin, Video, Clock } from 'lucide-react';
import { useFullscreen } from '../hooks/useFullscreen';

type AppProps = {
  data: UnderGroundSurveyData[];
  SelectedEvent: UnderGroundSurveyData | null
};

function App({ data, SelectedEvent }: AppProps) {
  const [datas, setData] = useState<UnderGroundSurveyData[]>([]);
  const [trackPoints, setTrackPoints] = useState<MapPosition[]>([]);
  const [videoData, setVideoData] = useState<UnderGroundSurveyData | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<MapPosition | null>(null);
  const [selection, setSelection] = useState<SegmentSelection>({
    start: null,
    end: null
  });
  const [availableVideos, setAvailableVideos] = useState<UnderGroundSurveyData[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVideoListOpen, setIsVideoListOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isPlayingSegment, setIsPlayingSegment] = useState(false);
  const [transitionImages, setTransitionImages] = useState<string[]>([]);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<{
    type: 'next' | 'previous';
    index: number;
    video: UnderGroundSurveyData;
  } | null>(null);


  const BASEURL_Val = import.meta.env.VITE_API_BASE;
  const baseUrl = `${BASEURL_Val}/public/`;
  const { enterFullscreen, exitFullscreen } = useFullscreen();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setData(data);
    // Filter out video records
    const videos = data.filter(item =>
      item.event_type === "VIDEORECORD" && item.surveyUploaded === 'true' &&
      (item.videoDetails?.videoUrl || item.videoUrl) &&
      ((item?.videoDetails?.videoUrl?.trim().replace(/(^"|"$)/g, '') || item?.videoUrl?.trim().replace(/(^"|"$)/g, '')) !== "")

    );
    setAvailableVideos(videos);
    if (videos.length > 0) {
      // setVideoData(videos[0]);
      //  setSelectedVideo(videos[0].id)
      let initialVideo = videos[0];
      let initialIndex = 0;
      if (SelectedEvent) {
        const selectedTime = new Date(SelectedEvent.createdTime || SelectedEvent.created_at).getTime();
        let closestVideo = videos[0];
        let closestIndex = 0;
        let minTimeDiff = Math.abs(selectedTime - closestVideo.videoDetails.startTimeStamp);

        videos.forEach((video, index) => {
          const startTimeDiff = Math.abs(selectedTime - video.videoDetails.startTimeStamp);
          const endTimeDiff = Math.abs(selectedTime - video.videoDetails.endTimeStamp);
          const minDiff = Math.min(startTimeDiff, endTimeDiff);

          if (minDiff < minTimeDiff) {
            minTimeDiff = minDiff;
            closestVideo = video;
            closestIndex = index;
          }
        });

        initialVideo = closestVideo;
        initialIndex = closestIndex;
      }

      setVideoData(initialVideo);
      setSelectedVideo(initialVideo.id)
      setCurrentVideoIndex(initialIndex);
      const { trackPoints } = extractVideoRecordData(data.filter(item => item.survey_id === videos[0].survey_id));
      setTrackPoints(trackPoints);
      const initialTime = SelectedEvent
        ? new Date(SelectedEvent.createdTime || SelectedEvent.created_at).getTime()
        : initialVideo.videoDetails.startTimeStamp;
      setCurrentTime(initialTime);
      // setCurrentTime(videos[0].videoDetails.startTimeStamp);

    }
  }, []);

  // Update current position when time changes
  useEffect(() => {
    if (trackPoints.length > 0) {
      const position = getPositionAtTime(trackPoints, currentTime);
      setCurrentPosition(position);
    }
  }, [currentTime, trackPoints]);

  useEffect(() => {
    // Short delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      if (containerRef.current) {
        setIsFullscreen(true);
        enterFullscreen(containerRef.current);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [enterFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);

  }, []);


  const getImagesBetweenVideos = (currentVideo: UnderGroundSurveyData, nextVideo: UnderGroundSurveyData) => {
    const currentIndex = data.findIndex(item => item.id === currentVideo.id);
    const nextIndex = data.findIndex(item => item.id === nextVideo.id);

    if (currentIndex === -1 || nextIndex === -1) return [];
    const startIndex = Math.min(currentIndex, nextIndex) + 1;
    const endIndex = Math.max(currentIndex, nextIndex);

    const imageUrls: string[] = [];

    // Look at records between the two videos
    for (let i = startIndex + 1; i < endIndex; i++) {
      const item = data[i];
      // Collect all possible image URLs
      if (item.fpoiUrl && item.surveyUploaded === 'true' && item.event_type === "FPOI") imageUrls.push(item.fpoiUrl);
      if (item.kmtStoneUrl && item.surveyUploaded === 'true' && item.event_type === "KILOMETERSTONE") imageUrls.push(item.kmtStoneUrl);
      if (item.landMarkUrls && item.surveyUploaded === 'true' && item.event_type === "LANDMARK" && item.landMarkType !== "NONE") imageUrls.push(...JSON.parse(item.landMarkUrls));
      if (item.fiberTurnUrl && item.surveyUploaded === 'true' && item.event_type === "FIBERTURN") imageUrls.push(item.fiberTurnUrl);
      if (item.start_photos && item.surveyUploaded === 'true' && item.start_photos.length > 0 && item.event_type === "SURVEYSTART") imageUrls.push(...item.start_photos);
      if (item.end_photos && item.surveyUploaded === 'true' && item.end_photos.length > 0 && item.event_type === "ENDSURVEY") imageUrls.push(...item.end_photos);
      if (item.jointChamberUrl && item.surveyUploaded === 'true' && item.event_type === "JOINTCHAMBER") imageUrls.push(item.jointChamberUrl);
      if (item.road_crossing?.startPhoto && item.surveyUploaded === 'true' && item.event_type === "ROADCROSSING") imageUrls.push(item.road_crossing.startPhoto);
      if (item.road_crossing?.endPhoto && item.surveyUploaded === 'true' && item.event_type === "ROADCROSSING") imageUrls.push(item.road_crossing.endPhoto);
      if (item.routeIndicatorUrl && item.surveyUploaded === 'true' && item.event_type === "ROUTEINDICATOR") {
        try {
          const parsed = JSON.parse(item.routeIndicatorUrl);
          if (Array.isArray(parsed)) {
            imageUrls.push(...parsed);
          } else if (typeof parsed === 'string') {
            imageUrls.push(parsed);
          }
        } catch (e) {
          imageUrls.push(item.routeIndicatorUrl);
        }
      }

    }

    return imageUrls.filter(url => url && url.trim() !== '');
  };

  // Handle time update from video
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  // Handle seeking to a specific time
  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  // Get video URL
  const getVideoUrl = () => {
    if (videoData && videoData.videoDetails && videoData.videoDetails.videoUrl) {
      return `${baseUrl}${videoData.videoDetails.videoUrl}`;
    }
  };

  const handleVideoSelect = (video: UnderGroundSurveyData) => {
    const selectedIndex = availableVideos.findIndex(v => v.id === video.id);
    setCurrentVideoIndex(selectedIndex);
    setVideoData(video);
    const { trackPoints: newTrackPoints } = extractVideoRecordData(
      data.filter(item => item.survey_id === video.survey_id)
    );
    setTrackPoints(newTrackPoints);
    setCurrentTime(video.videoDetails.startTimeStamp);
    setSelection({ start: null, end: null });
    setIsVideoListOpen(false);
    setIsPlayingSegment(false);
  };
  // Handle segment selection
  const handleSelectionChange = (newSelection: SegmentSelection) => {
    setSelection(newSelection);
    if (newSelection.start) {
      // Find the video containing the start point
      const startVideoIndex = availableVideos.findIndex(video =>
        newSelection.start!.timestamp >= video.videoDetails.startTimeStamp &&
        newSelection.start!.timestamp <= video.videoDetails.endTimeStamp
      );

      if (startVideoIndex !== -1 && startVideoIndex !== currentVideoIndex) {
        handleVideoSelect(availableVideos[startVideoIndex]);
      }
      setCurrentTime(newSelection.start.timestamp);
      setIsPlayingSegment(true);
    }
  };

  // Handle next video
  const handleNextVideo = () => {
    if (currentVideoIndex < availableVideos.length - 1) {
      const nextIndex = currentVideoIndex + 1;
      const nextVideo = availableVideos[nextIndex];

      // Get images between current and next video
      const images = getImagesBetweenVideos(availableVideos[currentVideoIndex], nextVideo);

      if (images.length > 0) {
        setTransitionImages(images);
        setShowImageViewer(true);
        setPendingTransition({
          type: 'next',
          index: nextIndex,
          video: nextVideo
        });
        // The video transition will continue after the image viewer is closed
      } else {
        completeVideoTransition(nextIndex, nextVideo);
      }
    } else if (isPlayingSegment) {
      setIsPlayingSegment(false);
    }
  };

  const completeVideoTransition = (nextIndex: number, nextVideo: UnderGroundSurveyData) => {
    setCurrentVideoIndex(nextIndex);
    setVideoData(nextVideo);
    setSelectedVideo(nextVideo.id)
    const { trackPoints: newTrackPoints } = extractVideoRecordData(
      data.filter(item => item.survey_id === nextVideo.survey_id)
    );
    setTrackPoints(newTrackPoints);
    // If playing a segment, start from beginning of next video
    if (isPlayingSegment) {
      setCurrentTime(nextVideo.videoDetails.startTimeStamp);
    } else {
      setCurrentTime(nextVideo.videoDetails.startTimeStamp);
      setSelection({ start: null, end: null });
    }
  };

  const handlePreviousVideo = () => {
    if (currentVideoIndex > 0) {
      const prevIndex = currentVideoIndex - 1;
      const prevVideo = availableVideos[prevIndex];
      // Get images between previous and current video
      const images = getImagesBetweenVideos(prevVideo, availableVideos[currentVideoIndex]);

      if (images.length > 0) {
        setTransitionImages(images);
        setShowImageViewer(true);
        setPendingTransition({
          type: 'previous',
          index: prevIndex,
          video: prevVideo
        });
        // The video transition will continue after the image viewer is closed
      } else {
        completePreviousVideoTransition(prevIndex, prevVideo);
      }
    }
  };

  const completePreviousVideoTransition = (prevIndex: number, prevVideo: UnderGroundSurveyData) => {
    setCurrentVideoIndex(prevIndex);
    setVideoData(prevVideo);
    setSelectedVideo(prevVideo.id)
    const { trackPoints: newTrackPoints } = extractVideoRecordData(
      data.filter(item => item.survey_id === prevVideo.survey_id)
    );
    setTrackPoints(newTrackPoints);
    setCurrentTime(prevVideo.videoDetails.startTimeStamp);
    if (!isPlayingSegment) {
      setSelection({ start: null, end: null });
    }
  };


  const handleImageViewerClose = () => {
    setShowImageViewer(false);
    setTransitionImages([]);
    if (pendingTransition) {
      if (pendingTransition.type === 'next') {
        completeVideoTransition(pendingTransition.index, pendingTransition.video);
      } else {
        completePreviousVideoTransition(pendingTransition.index, pendingTransition.video);
      }
      setPendingTransition(null);
    }
  };

  const clearSelection = () => {
    handleSelectionChange({ start: null, end: null });
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-100">
      <div className="mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              <Camera className="mr-2" size={28} />
              Video Survey Viewer
            </h1>
            <p className="text-gray-600 mt-1">
              View survey videos with synchronized map tracking
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-4 ml-auto">
            <div className="text-gray-600 whitespace-nowrap">
              Video {currentVideoIndex + 1} of {availableVideos.length}
            </div>

            <div className="flex gap-2">


              <button
                onClick={() => setIsVideoListOpen(!isVideoListOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Video className="mr-2" size={20} />
                Select Video
              </button>
              <button
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                onClick={() => {
                  if (isFullscreen) {
                    exitFullscreen();
                    setIsFullscreen(false);
                  } else {
                    enterFullscreen(containerRef.current);
                    setIsFullscreen(true);
                  }
                }}
              >
                {isFullscreen ? 'Exit Full View' : 'Full View'}
              </button>
            </div>
          </div>
        </header>
        {/* Video Selection Panel */}
        {isVideoListOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Available Videos</h2>
                <button
                  onClick={() => setIsVideoListOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {availableVideos.map((video, index) => (

                  <div
                    key={video.id}
                    className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer
                     ${selectedVideo === video.id ? 'bg-blue-50 border-blue-500 shadow-md' : 'hover:bg-gray-50'}`}
                    onClick={() => { handleVideoSelect(video); setSelectedVideo(video.id) }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Survey #{video.id}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {video.area_type} - {video.route_details.routeType}
                        </p>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock size={16} className="mr-1" />
                        {new Date(video.videoDetails.startTimeStamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Image Viewer */}
        {showImageViewer && (
          <ImageViewer
            images={transitionImages}
            onClose={handleImageViewerClose}
            baseUrl={baseUrl}
          />
        )}

        <div className={`w-full grid grid-cols-1 lg:grid-cols-2 gap-0`}>
          {/* Video Player */}
          <div className={isFullscreen ? "h-[750px]" : "h-[400px] md:h-[500px]"}>
            <VideoPlayer
              videoUrl={getVideoUrl() ?? ""}
              currentTime={currentTime}
              onTimeUpdate={handleTimeUpdate}
              startTime={videoData?.videoDetails?.startTimeStamp}
              endTime={selection.end ? selection.end.timestamp : undefined}
              className="h-full"
              currentPosition={currentPosition}
              TrackPoints={trackPoints}
              onNextVideo={handleNextVideo}
              onPreviousVideo={handlePreviousVideo}
              hasNextVideo={currentVideoIndex < availableVideos.length - 1}
              hasPreviousVideo={currentVideoIndex > 0}
              isPlayingSegment={isPlayingSegment}

            />
          </div>

          {/* Map View */}
          <div className={isFullscreen ? "h-[750px]" : "h-[400px] md:h-[500px]"}>
            <MapView
              trackPoints={trackPoints}
              currentPosition={currentPosition}
              selection={selection}
              onSelectionChange={handleSelectionChange}
              className="h-full"
            />
          </div>
        </div>
        {/* Survey Info */}
        {videoData && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex justify-between items-center">
              <span className="flex items-center">
                <MapPin className="mr-2" size={20} />
                Survey Information
              </span>

              {selection.start && (
                <button
                  onClick={clearSelection}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear Selection
                </button>
              )}
            </h2>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Survey ID</p>
                <p className="font-medium">{videoData.survey_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Video ID</p>
                <p className="font-medium">{videoData.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Area Type</p>
                <p className="font-medium">{videoData.area_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Side Type</p>
                <p className="font-medium">{videoData.side_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Route Type</p>
                <p className="font-medium">{videoData.route_details.routeType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Route Belongs To</p>
                <p className="font-medium">{videoData.route_details.routeBelongsTo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Soil Type</p>
                <p className="font-medium">{videoData.route_details.soilType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Road Width</p>
                <p className="font-medium">{videoData.route_details.roadWidth} m</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Center To Margin</p>
                <p className="font-medium">{videoData.route_details.centerToMargin} m</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created Time</p>
                <p className="font-medium">{new Date(videoData.createdTime).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Panel */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">How to Use</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-500 text-xs font-medium mr-2 mt-0.5">1</span>
              Use the video player controls to play, pause, and seek through the video
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-500 text-xs font-medium mr-2 mt-0.5">2</span>
              Watch the blue marker on the map move along the route as the video plays
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-500 text-xs font-medium mr-2 mt-0.5">3</span>
              Click on a point on the map to mark the start of a video segment (green marker)
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-500 text-xs font-medium mr-2 mt-0.5">4</span>
              Click on another point to mark the end of the segment (red marker)
            </li>

          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;