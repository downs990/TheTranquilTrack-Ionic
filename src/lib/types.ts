export interface DataPoint { x: number; y: number; z: number; }

export interface Recording {
  id: string;
  name: string;
  timestamp: string;
  data: DataPoint[];
}
