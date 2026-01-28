export interface Driver {
  driverId: string;
  driverName: string;
  age: number;
  experience: number; // years
}

export interface DrowsinessEvent {
  eventId: string;
  driverId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null; // in seconds
  driverStatus: 'alert' | 'drowsy' | 'sleeping';
  severity: 'low' | 'medium' | 'high';
}

export interface DriverWithStatus extends Driver {
  currentStatus: 'alert' | 'drowsy' | 'sleeping' | 'offline';
  lastEventTime?: Date;
  totalDrowsinessTime: number; // in seconds
  eventCount: number;
}
