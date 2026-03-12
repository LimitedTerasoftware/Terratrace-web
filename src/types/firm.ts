export interface Firm {
  id: number;
  firm_name: string;
  authorised_person: string;
  authorised_mobile: string;
}

export type FirmFormData = Omit<Firm, 'id'>;
