export interface Machine {
  machine_id:string;
  id: string;
  serial_number: string;
  contractor_name: string;
  registration_number: string;
  model: string;
  manufacturer: string;
  year_of_manufacture: number;
  gps_tracker_id: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  assigned_project: string;
  created_at: Date;
  updated_at: Date;
}

export type MachineFormData = Omit<Machine, 'id' | 'created_at' | 'updated_at'>;