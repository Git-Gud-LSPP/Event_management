export type Vendor = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  website?: string;
  image?: string;
  distance: number;
};