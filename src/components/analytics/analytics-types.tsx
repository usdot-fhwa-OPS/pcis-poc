export type Primitive = string | number | boolean | null | undefined;

export interface TerminalCapacityRecord {
  capacity: number;
  capacityType: string;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  repeat: string;
  repeatConfig: Record<string, unknown>;
  updatedAt: Date;
}

export interface StatusDistribution {
  [status: string]: number;
}

export interface UpcomingEvent {
  cargoUnitID: string | null;
  containerID?: string | null;
  when: string;
  hoursUntil: number;
  containerStatus: string;
  bookingStatus: string;
  reservationStatus: string;
}

export interface TerminalAnalyticsData {
  statusDistribution: StatusDistribution;
  approvalQueueSummary: StatusDistribution;
  eventsToday: UpcomingEvent[];
}

export interface BCOAnalyticsData {
  cargoStatus: StatusDistribution;
  shipmentTimeline: UpcomingEvent[];
  transportationAssignmentSummary: StatusDistribution;
}

export interface TransOpAnalyticsData {
  workloadByStatus: StatusDistribution;
  decisionSummary: StatusDistribution;
  calendarEvents: UpcomingEvent[];
}

export interface AnalyticsContext {
  email: string | null;
  destination: string | null;
  itemCount: number;
}

export interface AnalyticsResponse {
  ok: boolean;
  role?: string;
  message?: string;
  context?: AnalyticsContext;
  data?: TerminalAnalyticsData | BCOAnalyticsData | TransOpAnalyticsData;
}

export type DashboardVariant = 'full' | 'compact';
