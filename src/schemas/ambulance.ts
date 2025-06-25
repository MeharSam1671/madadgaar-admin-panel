export interface Ambulance {
  id: number;
  plateNumber: string;
  assignedTo: {
    id: string;
    name: string;
    address: string;
    suburb: string;
    city: string;
    district: string;
    phone: string;
    email: string;
  };
  driver: {
    id: number;
    name: string;
    phone: string;
    isOnline: boolean;
  };
  model: string;
  modelYear: number;
  type: string;
  status: string;
  capacity: number;
  lat: number;
  lang: number;
  createdAt: string;
  updatedAt: string;
  assignedToId: number;
  unavailableUntil?: string;
  lastMaintenanceAt?: string;
}
