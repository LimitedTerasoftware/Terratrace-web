export interface Machine {
  machine_id?:string;
  id: string;
  firm_name:string;
  authorised_person:string;
  machine_make:string;
  capacity:string;
  year_of_manufacture: number;
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