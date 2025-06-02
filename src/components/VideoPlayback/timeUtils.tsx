import { UnderGroundSurveyData, MapPosition } from './types';

export const getEventTime = (item: UnderGroundSurveyData, isEnd = false): number => {
  if (item.event_type === "VIDEORECORD") {
    return isEnd
      ? item.videoDetails?.endTimeStamp ?? 0
      : item.videoDetails?.startTimeStamp ?? 0;
  }
  return new Date(item.createdTime || item.created_at).getTime();
};

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

export const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const getVideoTimeFromMapPosition = (
  position: MapPosition,
  trackPoints: MapPosition[]
): number => {
  if (trackPoints.length === 0) return 0;
  if (trackPoints.length === 1) return trackPoints[0].timestamp;

  // Find the two closest points
  let closestIndex = 0;
  let minDistance = Number.MAX_VALUE;

  trackPoints.forEach((point, index) => {
    const distance = calculateDistance(position.lat, position.lng, point.lat, point.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return trackPoints[closestIndex].timestamp;
};

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};