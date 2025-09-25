// lib/types.ts
export type PhotoEntry = {
  id: string;
  uri: string;       // URI del asset en la galería
  lat: number | null;
  lng: number | null;
  timestamp: number; // Date.now()
  note?: string;
};
