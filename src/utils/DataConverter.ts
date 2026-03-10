import { MachineDataListItem, } from '../types/machine';
import { DepthDataPoint } from '../types/survey';

export const convertMachineDataToDepthData = (machineData: MachineDataListItem[]): DepthDataPoint[] => {
  return machineData
    .filter(item => item.depthMeters && item.depthMeters !== '0' && item.depthMeters !== '0m')
    .map(item => ({
      id:item.id,
      state_id: item.state_id,
      distrct_id: item.district_id,
      block_id: item.block_id,
      gp_id: item.gp_id,
      link_name: item.link_name || '',
      startPointPhoto: item.startPointPhoto || '',
      startPointCoordinates: item.startPointCoordinates || '',
      status: item.status,
      start_lgd: item.start_lgd,
      end_lgd: item.end_lgd,
      machine_id: item.machine_id,
      contractor_details: item.contractor_details || '',
      distance: item.distance || '0',
      depthMeters: item.depthMeters,
      created_at: item.created_at,
      survey_id: item.survey_id,
      eventType: item.eventType,
      depthLatlong: item.depthLatlong,
      depthPhoto:item.depthPhoto,
      start_lgd_name:item.start_lgd_name,
      end_lgd_name:item.end_lgd_name,
      machine_registration_number:item.machine_registration_number,
      startPitLatlong: item.startPitLatlong,
      startPitPhotos:item.startPitPhotos,
      endPitLatlong: item.endPitLatlong,
      endPitPhotos:item.endPitPhotos,
      jointChamberLatLong: item.jointChamberLatLong,
      jointChamberPhotos:item.jointChamberPhotos,
      manholeLatLong: item.manholeLatLong,
      manholePhotos:item.manholePhotos,
      endPitDoc:item.endPitDoc
    }));
};