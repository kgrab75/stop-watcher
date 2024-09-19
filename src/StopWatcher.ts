import type { StopLine } from './models/dataset/StopLine';
import type { MonitoredStopVisit } from './models/prim/StopMonitoring';
import type { Mode, StopWatcherOptions } from './models/StopWatcher';
import { DatasetAPI } from './resources/datasetAPI';
import { PrimAPI } from './resources/primAPI';
import { getRelativeTime, isValidDate } from './utils/date';

type NextStop = {
  destination: string;
  next: Date | string;
};

interface LineInfo {
  name: string;
  color: string;
  transport: string;
}

interface NextStopInfo {
  direction: string;
  stop: string;
  nextStops: NextStop[];
  lineInfo: LineInfo;
}

class StopWatcher {
  IDFM_AUTH_URL: string = 'https://prim.iledefrance-mobilites.fr/';
  static MODE = {
    BUS: 'Bus',
    METRO: 'Metro',
    TRAM: 'Tramway',
    RER: 'RapidTransit',
    TER: 'LocalTrain',
  } as const;

  private readonly apiKey: string;
  private readonly locale: string;
  private readonly asDate: boolean;
  private readonly exactMatch: boolean;
  private readonly municipalityName: string;

  private lineInfoCache = new Map<string, LineInfo>();

  private datasetAPI!: DatasetAPI;

  constructor(options: StopWatcherOptions) {
    if (!options.apiKey) {
      throw new Error(
        `apiKey is mandatory! You can generate this apikey by signing up here: ${this.IDFM_AUTH_URL}`,
      );
    }
    this.apiKey = options.apiKey;
    this.locale = options.locale || 'fr';
    this.asDate = options.asDate || false;
    this.exactMatch = options.exactMatch || false;
    this.municipalityName = options.municipalityName || 'Paris';
  }

  private async getStopLines(): Promise<StopLine[]> {
    try {
      const stopLineRecords = await this.datasetAPI.getStopLineRecords();

      return stopLineRecords.map((stopLineRecord) => {
        const fields = stopLineRecord.fields;
        return {
          stopId: fields.stop_id.split(':').at(-1) || '',
          lineId: fields.id.split(':').at(-1) || '',
          stopName: fields.stop_name,
          lineName: fields.route_long_name,
        };
      });
    } catch (error) {
      console.error('Error retrieving data:', error);
      return [];
    }
  }

  async getLineInfo(lineId: string): Promise<LineInfo> {
    try {
      const cachedLineInfo = this.lineInfoCache.get(lineId);
      if (cachedLineInfo) {
        return cachedLineInfo;
      }

      const lineRecord = await this.datasetAPI.getLineRecord(lineId);

      const {
        name_line: name,
        colourweb_hexa: color,
        transportmode: transport,
      } = lineRecord.fields;

      this.lineInfoCache.set(lineId, { name, color, transport });
      return { name, color, transport };
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      return { name: '', color: '', transport: '' };
    }
  }

  private async extractStopsByDestination(
    monitoredStopVisits: MonitoredStopVisit[],
    stopLine: StopLine,
  ): Promise<NextStopInfo[]> {
    const transform = this.asDate
      ? (date: string) => date
      : (date: string) => getRelativeTime(date, this.locale);

    const groupedStops = new Map<string, NextStopInfo>();

    for (const visit of monitoredStopVisits) {
      const monitoredVehicleJourney = visit.MonitoredVehicleJourney;
      const monitoredCall = monitoredVehicleJourney.MonitoredCall;

      const next =
        monitoredCall.ExpectedDepartureTime ||
        monitoredCall.ExpectedArrivalTime ||
        monitoredCall.AimedDepartureTime ||
        monitoredCall.AimedArrivalTime ||
        monitoredCall.DepartureStatus;

      if (isValidDate(next) && new Date(next) < new Date()) {
        continue;
      }

      const direction =
        monitoredVehicleJourney.DirectionName[0]?.value || 'unknown';

      const destination =
        monitoredCall.DestinationDisplay[0]?.value || direction;
      const stop = monitoredCall.StopPointName[0]?.value || 'unknown';

      if (stop === destination) {
        continue;
      }

      if (!groupedStops.has(direction)) {
        groupedStops.set(direction, {
          direction,
          stop,
          nextStops: [],
          lineInfo: await this.getLineInfo(stopLine.lineId),
        });
      }

      groupedStops
        .get(direction)
        ?.nextStops.push({ destination, next: transform(next) });
    }

    return Array.from(groupedStops.values());
  }

  async getNextStops(
    query: string,
    mode?: Mode | null,
    lineName?: string | null,
  ): Promise<NextStopInfo[]> {
    this.datasetAPI = new DatasetAPI({
      exactMatch: this.exactMatch,
      municipalityName: this.municipalityName,
      query,
      mode,
      lineName,
    });

    const stopLines = await this.getStopLines();

    const primAPI = new PrimAPI({ apiKey: this.apiKey });

    const nextStops = await Promise.all(
      stopLines.map(async (stopLine) => {
        const monitoredStopVisits = await primAPI.getStopMonitoringVisits(
          stopLine,
          mode,
        );

        const monitoredStopVisit = monitoredStopVisits[0];
        if (monitoredStopVisit === undefined) {
          return [
            {
              destination: 'unknown',
              direction: 'unknown',
              stop: stopLine.stopName,
              nextStops: [],
              lineInfo: await this.getLineInfo(stopLine.lineId),
            },
          ];
        }

        return await this.extractStopsByDestination(
          monitoredStopVisits,
          stopLine,
        );
      }),
    );

    return nextStops.flat();
  }
}

export { StopWatcher };
