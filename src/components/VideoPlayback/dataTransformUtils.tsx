import { UnderGroundSurveyData, MapPosition } from './types';
import { getEventTime } from './timeUtils';

export const filterGPSNoise = (
  trackPoints: MapPosition[],
  startTimestamp: number
): MapPosition[] => {
  if (trackPoints.length === 0) return trackPoints;

  return trackPoints.filter(point => point.timestamp >= startTimestamp);
};

export const extractVideoRecordData = (data: UnderGroundSurveyData[]): {
  videoData: UnderGroundSurveyData | null;
  trackPoints: MapPosition[];
  startTimestamp: number;
} => {
    const videoRecords = data
                          .filter(
                            item =>
                              item.event_type === 'VIDEORECORD' &&
                              item.surveyUploaded === 'true' &&
                              (item?.videoDetails?.videoUrl || item.videoUrl) &&
                              ((item?.videoDetails?.videoUrl?.trim().replace(/(^"|"$)/g, '') ||
                                item?.videoUrl?.trim().replace(/(^"|"$)/g, '')) !== '') &&
                              item.videoDetails?.startTimeStamp > 0
                          )
                          .sort((a, b) => getEventTime(a) - getEventTime(b));

  const videoData = videoRecords[0] || null;

  if (!videoData) return { videoData: null, trackPoints: [] ,startTimestamp: 0 };

  const firstVideoStart = videoData.videoDetails.startTimeStamp;
  const firstVideoEnd = videoData.videoDetails.endTimeStamp;

  let startEvent: UnderGroundSurveyData | undefined;

  // const routeDetails = data.find(
  //   item =>
  //     item.event_type === 'ROUTEDETAILS' &&
  //     getEventTime(item) >= firstVideoStart &&
  //     getEventTime(item) <= firstVideoEnd
  // );
   const routeDetails = data.find(
    item =>
      item.event_type === 'ROUTEDETAILS' 
  );
  // if (routeDetails) {
  //   startEvent = data.find(
  //     item =>
  //       item.event_type === 'LIVELOCATION' &&
  //       getEventTime(item) > getEventTime(routeDetails)
  //   );
  // }
  if (routeDetails) {
    const routeTS = getEventTime(routeDetails);

    // All LIVELOCATION after ROUTEDETAILS
    const livePointsAfterRoute = data
      .filter(
        item =>
          item.event_type === 'LIVELOCATION' &&
          getEventTime(item) > routeTS
      )
      .sort((a, b) => getEventTime(a) - getEventTime(b)); // ascending order

    if (livePointsAfterRoute.length > 0) {
      // Keep only the LAST point for each lat/lng cluster
      const lastByCoords = new Map<string, UnderGroundSurveyData>();

      for (const point of livePointsAfterRoute) {
        const key = `${point.latitude}-${point.longitude}`;
        lastByCoords.set(key, point); // overwrites → keeps the last one
      }

      // Convert map values back to list and sort by time
      const uniqueKeepLast = Array.from(lastByCoords.values())
        .sort((a, b) => getEventTime(a) - getEventTime(b));

      // Select the last point as startEvent
      startEvent = uniqueKeepLast[0];
    }
  }

  if (!startEvent) {
    startEvent = data.find(item => item.event_type === 'LIVELOCATION');
  }


  const startTimestamp = startEvent ? getEventTime(startEvent) : firstVideoStart;


  // Extract all location data points for the track
  let trackPoints: MapPosition[] = data
  
    .filter(item => {
      // Include all LIVELOCATION entries
      if (item.event_type === 'LIVELOCATION') return true;
                       

      // Include start and end points from VIDEORECORD
      if (item.event_type === 'VIDEORECORD' && item.surveyUploaded === 'true') {
        const hasValidCoords = 
          item.videoDetails?.startLatitude && 
          item.videoDetails?.startLongitude &&
          item.videoDetails?.endLatitude && 
          item.videoDetails?.endLongitude;

        return hasValidCoords;
      }

      return false;
    })
    .flatMap(item => {
      if (item.event_type === 'LIVELOCATION') {
        return [{
          lat: parseFloat(item.latitude),
          lng: parseFloat(item.longitude),
          timestamp: getEventTime(item)
        }];
      } else if (item.event_type === 'VIDEORECORD'  && item.surveyUploaded === 'true') {
        // Add both start and end points for video records
        return [
          {
            lat: item.videoDetails.startLatitude,
            lng: item.videoDetails.startLongitude,
            timestamp: item.videoDetails.startTimeStamp
          },
          {
            lat: item.videoDetails.endLatitude,
            lng: item.videoDetails.endLongitude,
            timestamp: item.videoDetails.endTimeStamp
          }
        ];
      }
      return [];
    })
    .sort((a, b) => a.timestamp - b.timestamp);

    trackPoints = filterGPSNoise(trackPoints, startTimestamp);

  return { videoData, trackPoints,startTimestamp };
};
export const getPositionAtTime = (
  trackPoints: MapPosition[],
  timestamp: number
): MapPosition | null => {
  if (!trackPoints.length) return null;
  
  // If timestamp is before first point
  if (timestamp <= trackPoints[0].timestamp) {
    return trackPoints[0];
  }
  
  // If timestamp is after last point
  if (timestamp >= trackPoints[trackPoints.length - 1].timestamp) {
    return trackPoints[trackPoints.length - 1];
  }
  
  // Find two points that timestamp falls between
  for (let i = 0; i < trackPoints.length - 1; i++) {
    const current = trackPoints[i];
    const next = trackPoints[i + 1];
    
    if (timestamp >= current.timestamp && timestamp <= next.timestamp) {
      // Calculate position using linear interpolation
      const ratio = (timestamp - current.timestamp) / (next.timestamp - current.timestamp);
      return {
        lat: current.lat + (next.lat - current.lat) * ratio,
        lng: current.lng + (next.lng - current.lng) * ratio,
        timestamp
      };
    }
  }
  
  return null;
};

export const getTrackBounds = (trackPoints: MapPosition[]): [[number, number], [number, number]] | null => {
  if (!trackPoints.length) return null;
  
  let minLat = trackPoints[0].lat;
  let maxLat = trackPoints[0].lat;
  let minLng = trackPoints[0].lng;
  let maxLng = trackPoints[0].lng;
  
  trackPoints.forEach(point => {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  });
  
  // Add some padding
  const latPadding = (maxLat - minLat) * 0.1;
  const lngPadding = (maxLng - minLng) * 0.1;
  
  return [
    [minLat - latPadding, minLng - lngPadding],
    [maxLat + latPadding, maxLng + lngPadding]
  ];
};