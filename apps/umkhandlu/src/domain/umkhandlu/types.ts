import type { RecordType, RecordStatus, NoticeType, NoticeStatus } from './enums';

export interface GovernanceRecord {
  id: string;
  type: RecordType;
  title: string;
  content: string;
  status: RecordStatus;
  authorityId: string | null;
  approvedBy: string | null;
  parentRecordId: string | null;
  originNoticeId: string | null;
  weatherContext: WeatherSnapshot | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceNotice {
  id: string;
  type: NoticeType;
  title: string;
  content: string;
  status: NoticeStatus;
  isStatutory: boolean;
  commentDeadline: string | null;
  commentsReceived: number;
  weatherContext: WeatherSnapshot | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherSnapshot {
  type: 'forecast' | 'historical';
  condition: string;
  temperatureCelsius: number;
  tempMinCelsius: number;
  tempMaxCelsius: number;
  rainfallMm: number;
  windKmh: number;
  humidityPercent: number;
  uvIndex: number;
  fetchedAt: string;
}

export interface GovernancePerson {
  id: string;
  name: string;
  role: string;
  nodeId: string | null;
  createdAt: string;
}

export interface GovernanceNode {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}
