import { useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GroundSurvey, UnderGroundSurveyData, MediaFile, FolderStructure } from '../../types/survey';
import * as XLSX from 'xlsx';


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
// const baseUrl = import.meta.env.VITE_Image_URL;
const baseUrl = "https://docs.tricadtrack.com/Tricad/"

export class MediaExportService {
  
  //--- Extract all media files from a survey item based on event type ---
  
  private extractMediaFromSurveyItem(item: UnderGroundSurveyData): MediaFile[] {
    const mediaFiles: MediaFile[] = [];

    // ---Only process items that are uploaded---
    if (item.surveyUploaded !== "true") {
      return mediaFiles;
    }

    const addMediaFile = (url: string, filename: string, type: 'image' | 'video',videoDetails:any) => {
      if (url && url.trim()) {
        mediaFiles.push({
          url: url.startsWith('http') ? url : `${baseUrl}${url}`,
          filename,
          eventType: item.event_type,
          type,
          videoDetails
        });
      }
    };

    switch (item.event_type) {
      case "FPOI":
        if (item.fpoiUrl) {
          addMediaFile(item.fpoiUrl, `fpoi_${item.latitude}_${item.longitude}.jpg`, 'image','');
        }
        break;

      case "SURVEYSTART":
        if (item.start_photos && item.start_photos.length > 0) {
          item.start_photos.forEach((photo, index) => {
            addMediaFile(photo, `start_photo_${index + 1}_${item.latitude}_${item.longitude}.jpg`, 'image','');
          });
        }
        break;

      case "ENDSURVEY":
        if (item.end_photos && item.end_photos.length > 0) {
          item.end_photos.forEach((photo, index) => {
            addMediaFile(photo, `end_photo_${index + 1}_${item.latitude}_${item.longitude}.jpg`, 'image','');
          });
        }
        break;

      // case "ROUTEINDICATOR":
      //   if (item.routeIndicatorUrl) {
      //     addMediaFile(item.routeIndicatorUrl, `route_indicator_${item.id}.jpg`, 'image');
      //   }
      //   break;
      case "ROUTEINDICATOR":
        if (item.routeIndicatorUrl) {
          try {
            const parsed = JSON.parse(item.routeIndicatorUrl);
            if (Array.isArray(parsed)) {
              parsed.forEach((url, index) => {
                addMediaFile(url, `route_indicator_${index + 1}_${item.latitude}_${item.longitude}.jpg`, 'image','');
              });
            } else if (typeof parsed === 'string') {
              addMediaFile(parsed, `route_indicator_${item.latitude}_${item.longitude}.jpg`, 'image','');
            }
          } catch (e) {
            addMediaFile(item.routeIndicatorUrl, `route_indicator_${item.latitude}_${item.longitude}.jpg`, 'image','');
          }
        }
        break;


      case "JOINTCHAMBER":
        if (item.jointChamberUrl) {
          addMediaFile(item.jointChamberUrl, `joint_chamber_${item.latitude}_${item.longitude}.jpg`, 'image','');
        }
        break;

      case "ROADCROSSING":
        if (item.road_crossing?.startPhoto) {
          addMediaFile(item.road_crossing.startPhoto, `${item.road_crossing?.roadCrossing}_start_${item.latitude}_${item.longitude}.jpg`, 'image','');
        }
        if (item.road_crossing?.endPhoto) {
          addMediaFile(item.road_crossing.endPhoto, `${item.road_crossing?.roadCrossing}_end_${item.latitude}_${item.longitude}.jpg`, 'image','');
        }
        break;

      case "KILOMETERSTONE":
        if (item.kmtStoneUrl) {
          addMediaFile(item.kmtStoneUrl, `km_stone_${item.latitude}_${item.longitude}.jpg`, 'image','');
        }
        break;

      case "LANDMARK":
        if (item.landMarkUrls && item.landMarkType !== "NONE") {
          try {
            const landmarkUrls = JSON.parse(item.landMarkUrls);
            landmarkUrls
              .filter((url: string) => url && url.trim())
              .forEach((url: string, index: number) => {
                addMediaFile(url, `landmark_${index + 1}_${item.latitude}_${item.longitude}.jpg`, 'image','');
              });
          } catch (error) {
            console.error('Error parsing landmark URLs:', error);
          }
        }
        break;

      case "FIBERTURN":
        if (item.fiberTurnUrl) {
          addMediaFile(item.fiberTurnUrl, `fiber_turn_${item.latitude}_${item.longitude}.jpg`, 'image','');
        }
        break;

      case "VIDEORECORD":
        const mainUrl = item.videoUrl?.trim().replace(/^"|"$/g, "");
        const fallbackUrl = item.videoDetails?.videoUrl?.trim().replace(/^"|"$/g, "");
        const videoUrl = mainUrl || fallbackUrl;
        if (videoUrl) {
          addMediaFile(videoUrl, `video_${item.videoDetails?.startLatitude}_${item.videoDetails?.startLongitude}_to_${item.videoDetails?.endLatitude}_${item.videoDetails?.endLongitude}.mp4`, 'video',
                  item.videoDetails || {}

          );
        }
        break;
    }

    return mediaFiles;
  }

  
   // ---Group surveys by block and GPS coordinates---
   
  private groupSurveysByFolder(surveys: GroundSurvey[]): FolderStructure {
    const folderStructure: FolderStructure = {};

    surveys.forEach(survey => {
      const blockCode = survey.start_gp?.blk_name;
      const startGp = survey.start_gp?.name || 'UnknownStart';
      const endGp = survey.end_gp?.name || 'UnknownEnd';
      const start_lgd = survey.start_gp?.lgd_code || '-';
      const end_lgd = survey.end_gp?.lgd_code || '-';
      
      const folderPath = `${blockCode}/${startGp}_${endGp}`;
      
      if (!folderStructure[folderPath]) {
        folderStructure[folderPath] = [];
      }

      //--- Extract media from all survey data items ---
      survey.under_ground_survey_data.forEach(item => {
        const mediaFiles = this.extractMediaFromSurveyItem(item);
        folderStructure[folderPath].push(...mediaFiles);
      });
    });

    return folderStructure;
  }

  
   // ----- Download a file from URL and return as blob
   
  private async downloadFile(url: string): Promise<Blob> {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to download ${url}: ${response.statusText}`);
      }
      return await response.blob();
    } catch (error) {
      console.error(`Error downloading ${url}:`, error);
      throw error;
    }
  }


   // -----Create and download ZIP file with folder structure
  
  async exportMediaWithStructure(
    surveys: GroundSurvey[],
    onProgress?: (current: number, total: number, currentFile: string) => void
  ): Promise<void> {
    const mappingData: any[] = [];

    const zip = new JSZip();
    const folderStructure = this.groupSurveysByFolder(surveys);
    
    // Calculate total files for progress tracking
    const totalFiles = Object.values(folderStructure)
      .reduce((sum, files) => sum + files.length, 0);
    
    let currentFileIndex = 0;
    
    try {
      // Process each folder
      for (const [folderPath, mediaFiles] of Object.entries(folderStructure)) {
        if (mediaFiles.length === 0) continue;

        // Create folder in ZIP
        const folder = zip.folder(folderPath);
        if (!folder) continue;

        // Download and add each media file
        for (const mediaFile of mediaFiles) {
          currentFileIndex++;
          
          if (onProgress) {
            onProgress(currentFileIndex, totalFiles, mediaFile.filename);
          }
          try {
            const fileBlob = await this.downloadFile(mediaFile.url);
            folder.file(mediaFile.filename, fileBlob);
              const FilePath = `${folderPath}/${mediaFile.filename}`;
              const blockCode = folderPath.split('/')[0];
              const gpCode = folderPath.split('/')[1];
              const survey = surveys.find(s => 
                s.start_gp?.blk_name === blockCode && 
                `${s.start_gp?.name}_${s.end_gp?.name}` === gpCode
              );

              const RouteId = `${survey?.start_gp?.lgd_code || '-'}` + '_' + `${survey?.end_gp?.lgd_code || '-'}`;

              const mappingEntry: any = {
                Layers: mediaFile.eventType,
                UniqueId: gpCode,
                RouteId,
                FilePath
              };

             if (mediaFile.type === 'video' && mediaFile.videoDetails) {
                Object.entries(mediaFile.videoDetails).forEach(([key, value]) => {
                  mappingEntry[key] = value;
                });
              }

              mappingData.push(mappingEntry);

          } catch (error) {
            console.error(`Failed to download ${mediaFile.filename}:`, error);
            // Continue with other files even if one fails
          }
        }
      }
      
      const worksheet = XLSX.utils.json_to_sheet(mappingData);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Media Mapping');

      // Create binary Excel buffer
      const excelBuffer = XLSX.write(workbook, {
        type: 'array',
        bookType: 'xlsx'
      });

            // Add to ZIP root
      zip.file('media_mapping.xlsx', excelBuffer);

      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Media_Folder.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error creating ZIP file:', error);
      throw error;
    }
  }
}