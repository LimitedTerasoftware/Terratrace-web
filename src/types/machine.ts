export interface Machine {
  machine_id:string;
  id: string;
  firm_name:string;
  authorised_person:string;
  machine_make:string;
  capacity:string;
  year_of_manufacture: number | null;
  no_of_rods:number;
  digitrack_make:string;
  digitrack_model:string;
  truck_make:string;
  truck_model:string;
  registration_number: string;
  registration_valid_upto:Date;
  driver_batch_no:string;
  driver_valid_upto:Date;
  serial_number: string;
  supervisor_name :string ,
  supervisor_email :string,
  supervisor_phone :string,
  author_phone :string,
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  created_at: Date;
  updated_at: Date;

  // contractor_name: string;
  // model: string;
  // manufacturer: string;
  // gps_tracker_id: string;
  // assigned_project: string;
}

export type MachineFormData = Omit<Machine, 'id' | 'created_at' | 'updated_at'>;

export interface DailyDistance {
  date: string;
  totalDistance: number;
  meetsDailyRequirement: boolean;
  difference: number;
}

export interface MachineData {
  machineId: string;
  dailyDistances: DailyDistance[];
  monthlyTotalDistance: number;
  machineRent: number;
  monthlyPenalty: number | null;
  monthlyIncentive: number | null;
  netCost: number;
}

export interface DepthEvent {
  id: number;
  depth: number;
  latlong: string;
  eventType: string;
  created_at: string;
  alert: boolean;
}

export interface DepthPenalties{
  totalDepthEvents: number;
  penalty500: number;
  penalty1100: number;
  alerts: number;
  totalDepthPenalty: number;
  details: DepthEvent[];

}

export interface ApiResponse {
  status: boolean;
  data: MachineData[];
  depthPenalties: DepthPenalties;
  filters: {
    machine_id: string;
    month: number;
    year: number;
    from_date: string;
    to_date: string;
    query_date: string;
  };
}


export interface PerformanceMetrics {
  status: 'excellent' | 'good' | 'warning' | 'penalty';
  message: string;
  color: string;
  bgColor: string;
}