import type { Mode } from '../StopWatcher';

export interface StopLine {
  stopId: string;
  lineId: string;
  stopName: string;
  lineName: string;
}

export interface DatasetApiOptions {
  exactMatch?: boolean;
  municipalityName?: string;
  omitModeLimit?: number;
  query: string;
  mode?: Mode | null;
  lineName?: string | null;
}

export interface StopLineRecord {
  recordid: string;
  fields: {
    id: string;
    route_long_name: string;
    stop_name: string;
    stop_id: string;
  };
}

export interface StopLineDatasetApiResponse {
  records: StopLineRecord[];
}
