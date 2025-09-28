export interface MapRecord {
  id: string;
  title: string;
  createdAt: string;
  bounds: any;
  address?: string;
  mapNumber?: number;
  mapNumberText?: string;
  regionType?: 'domestic' | 'overseas';
  prefecture?: string;
  countryCode?: string;
}

