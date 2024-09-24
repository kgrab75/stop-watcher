import axios, { type AxiosInstance } from 'axios';

import type {
  MonitoredStopVisit,
  PrimApiOptions,
  StopMonitoringPrimApiResponse,
} from '../models/prim/StopMonitoring';
import type { StopLine } from '../models/dataset/StopLine';
import type { Mode } from '../models/StopWatcher';
import { StopWatcher } from '../StopWatcher';

export class PrimAPI {
  PRIM_API_ORIGIN = 'https://prim.iledefrance-mobilites.fr';
  PRIM_API_PATHNAME = '/marketplace/stop-monitoring';

  private axiosPrimAPI: AxiosInstance;

  private readonly apiKey: string;

  constructor(options: PrimApiOptions) {
    this.apiKey = options.apiKey;
    this.axiosPrimAPI = axios.create({ baseURL: this.PRIM_API_ORIGIN });
  }

  private getStopMonitoringParams(
    stopId: string,
    lineId: string,
    mode?: Mode | null,
  ) {
    const params =
      mode !== StopWatcher.MODE.RER && mode !== StopWatcher.MODE.TRANSILIEN
        ? {
            MonitoringRef: `STIF:StopPoint:Q:${stopId}:`,
            LineRef: `STIF:Line::${lineId}:`,
          }
        : {
            MonitoringRef: `STIF:StopArea:SP:${stopId}:`,
            LineRef: `STIF:Line::${lineId}:`,
          };

    return params;
  }

  async getStopMonitoringVisits(
    stopLine: StopLine,
    mode?: Mode | null,
  ): Promise<MonitoredStopVisit[]> {
    try {
      const params = this.getStopMonitoringParams(
        stopLine.stopId,
        stopLine.lineId,
        mode,
      );

      const response =
        await this.axiosPrimAPI.get<StopMonitoringPrimApiResponse>(
          this.PRIM_API_PATHNAME,
          {
            headers: { apiKey: this.apiKey },
            params: params,
          },
        );

      if (
        response.data.Siri.ServiceDelivery.StopMonitoringDelivery[0] ===
        undefined
      ) {
        throw new Error('StopMonitoringDelivery missing');
      }

      return response.data.Siri.ServiceDelivery.StopMonitoringDelivery[0]
        .MonitoredStopVisit;
    } catch (error) {
      console.error('Error retrieving data: ', error);
      return [];
    }
  }
}
