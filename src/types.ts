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

export type FrameType = 'none' | 'square_7_5cm' | 'rect_10x15cm';
