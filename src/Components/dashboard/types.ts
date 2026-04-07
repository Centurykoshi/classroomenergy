export const MANUAL_OFF_LOCK_MS = 10000;

export type DashboardFilter = "all" | "on" | "off" | "locked";

export interface ActivityLog {
  id: string;
  createdAt: string;
  action: string;
  userId: string | null;
  userName: string | null;
}

export interface Classroom {
  id: string;
  name: string;
  isLightOn: boolean;
  description: string | null;
  arduinoPin: number | null;
  activityLogs?: ActivityLog[];
}
