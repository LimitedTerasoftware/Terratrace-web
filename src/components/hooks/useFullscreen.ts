import { useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const useFullscreen = () => {
  const enterFullscreen = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) { /* Safari */
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) { /* IE11 */
      (element as any).msRequestFullscreen();
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) { /* Safari */
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) { /* IE11 */
      (document as any).msExitFullscreen();
    }
  }, []);

  return { enterFullscreen, exitFullscreen };
};

const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = `${BASEURL_Val}/public/`;
const sanitize = (str: string) => str?.replace(/[^\w.-]/g, "_") || "unknown";

const getFileExtension = (url: string = '') => {
  try {
    return url.split('.').pop()?.split(/\#|\?/)[0] || 'png';
  } catch {
    return 'png';
  }
};


export const exportMediaWithStructure = async (data: any[]) => {
  const zip = new JSZip();
   let i=1;
 for (const survey of data) {
  for (const item of survey.under_ground_survey_data) {
    const block = (item?.start_gp?.blk_name || '');
    const startGp = (item?.start_gp?.name || '');
    const endGp = (item?.end_gp?.name || '');
    const folderPath = `${block}/${startGp}_${endGp}`;

    const mediaFields = [
      { field: (item.event_type === "ROADCROSSING" && item.road_crossing?.startPhoto) && `${baseUrl}${item.road_crossing?.startPhoto}`, label: "crossing_start" },
      { field: (item.event_type === "ROADCROSSING" && item.road_crossing?.endPhoto) && `${baseUrl}${item.road_crossing?.endPhoto}`, label: "crossing_end" },
      { field: (item.event_type === "ROUTEINDICATOR" && item.routeIndicatorUrl) && `${baseUrl}${item.routeIndicatorUrl}`, label: "route_indicator" },
      { field: item.event_type === "SURVEYSTART" && `${baseUrl}${item.start_photos?.[0]}`, label: "survey_start" },
      { field: item.event_type === "ENDSURVEY" && `${baseUrl}${item.end_photos?.[0]}`, label: "survey_end" },
      { field: (item.event_type === "VIDEORECORD" && item.videoDetails?.videoUrl?.trim().replace(/^"|"$/g, "")) && `${baseUrl}${item.videoDetails?.videoUrl}`, label: `video_${i}` },
      { field: (item.event_type === "JOINTCHAMBER" && item.jointChamberUrl) && `${baseUrl}${item.jointChamberUrl}`, label: "joint_chamber" },
      { field: (item.event_type === "FPOI" && item.fpoiUrl) && `${baseUrl}${item.fpoiUrl}`, label: "fpoi" },
      { field: (item.event_type === "KILOMETERSTONE" && item.kmtStoneUrl) && `${baseUrl}${item.kmtStoneUrl}`, label: "kmstone" },
      { field:(item.event_type === "FIBERTURN" && item.fiberTurnUrl) && `${baseUrl}${item.fiberTurnUrl}`, label: "fiberturn" },
    ];
    // LANDMARKS: Parse and add as array
    let landmarkPhotos = [];
    if (item.event_type === 'LANDMARK') {
      try {
        landmarkPhotos = JSON.parse(item.landMarkUrls);
      } catch (err) {
        console.warn("Error parsing LANDMARK array", err);
      }
    }

    for (const { field, label } of mediaFields) {
      if (typeof field === 'string') {
        try {
          const fileUrl = field;
          const ext = getFileExtension(fileUrl);
          const response = await fetch(fileUrl);
          const blob = await response.blob();
          zip.file(`${folderPath}/${label}.${ext}`, blob);
        } catch (err) {
          console.warn(`Failed to fetch ${label}`, err);
        }
      }
    }


    // LANDMARK files
  for (let i = 0; i < landmarkPhotos.length; i++) {
  const photo = landmarkPhotos[i];
  if (typeof photo === 'string') 
 {
    try {
   const ext = getFileExtension(photo);
  const response = await fetch(photo);
  const blob = await response.blob();
  zip.file(`${folderPath}/landmark_${i + 1}.${ext}`, blob);
    } catch (err) {
      console.warn(`Failed to fetch landmark ${i + 1}`, err);
    }
  }
}

   i++;
  }
 }
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "SurveyMedia.zip");
};