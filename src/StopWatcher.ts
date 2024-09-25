import type { StopLine } from './models/dataset/StopLine';
import type { MonitoredStopVisit } from './models/prim/StopMonitoring';
import type { Mode, StopWatcherOptions } from './models/StopWatcher';
import { DatasetAPI } from './resources/datasetAPI';
import { PrimAPI } from './resources/primAPI';
import { getRelativeTime, isValidDate } from './utils/date';

interface Line {
  name: string;
  color: string;
  textColor: string;
  mode?: Mode;
}

interface Departure {
  destination: string;
  next: Date | string;
}

interface DirectionSchedule {
  name: string;
  upcomingDepartures: Departure[];
}

interface StopSchedule {
  stop: string;
  line: Line;
  directions: DirectionSchedule[];
}

class StopWatcher {
  IDFM_AUTH_URL: string = 'https://prim.iledefrance-mobilites.fr/';

  static MODE = {
    BUS: 'Bus',
    METRO: 'Metro',
    TRAM: 'Tramway',
    RER: 'RapidTransit',
    TRANSILIEN: 'LocalTrain',
    TER: 'regionalRail',
  } as const;

  private readonly apiKey: string;
  private readonly locale: string;
  private readonly asDate: boolean;
  private readonly exactMatch: boolean;
  private readonly municipalityName: string;
  private readonly omitModeLimit: number;

  private lineCache = new Map<string, Line>();

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
    this.omitModeLimit = options.omitModeLimit || 6;
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

  async getLine(lineId: string): Promise<Line> {
    const transpportMapping = new Map<string, Mode>([
      ['bus', StopWatcher.MODE.BUS],
      ['metro', StopWatcher.MODE.METRO],
      ['tram', StopWatcher.MODE.TRAM],
      ['rail-local', StopWatcher.MODE.RER],
      ['rail-suburbanRailway', StopWatcher.MODE.TRANSILIEN],
      ['rail-regionalRail', StopWatcher.MODE.TER],
    ]);
    try {
      const cachedLine = this.lineCache.get(lineId);
      if (cachedLine) {
        return cachedLine;
      }

      const lineRecord = await this.datasetAPI.getLineRecord(lineId);
      const fields = lineRecord.fields;

      const {
        name_line: name,
        colourweb_hexa: color,
        textcolourweb_hexa: textColor,
      } = fields;

      const line = {
        name,
        color,
        textColor,
        mode: transpportMapping.get(
          fields.transportmode === 'rail'
            ? `${fields.transportmode}-${fields.transportsubmode}`
            : fields.transportmode,
        ),
      };

      this.lineCache.set(lineId, line);
      return line;
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      return { name: '', color: '', textColor: '', mode: undefined };
    }
  }

  private async extractStopsByDestination(
    monitoredStopVisits: MonitoredStopVisit[],
  ): Promise<DirectionSchedule[]> {
    const transform = this.asDate
      ? (date: string) => new Date(date)
      : (date: string) => getRelativeTime(date, this.locale);

    const directionSchedules = new Map<string, DirectionSchedule>();

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

      const directionName =
        monitoredVehicleJourney.DirectionName[0]?.value || 'unknown';

      const destination =
        monitoredCall.DestinationDisplay[0]?.value || directionName;

      const stop = monitoredCall.StopPointName[0]?.value || 'unknown';

      if (stop === destination) {
        continue;
      }

      if (!directionSchedules.has(directionName)) {
        directionSchedules.set(directionName, {
          name: directionName,
          upcomingDepartures: [],
        });
      }
      const directionSchedule = directionSchedules.get(directionName);
      if (directionSchedule === undefined) {
        throw new Error('error directionSchedule undefined');
      }

      directionSchedule.upcomingDepartures.push({
        destination,
        next: transform(next),
      });
    }

    return (
      Array.from(directionSchedules.values()) || [
        {
          name: 'unknown',
          upcomingDepartures: [],
        },
      ]
    );
  }

  async getStopSchedules(
    query: string,
    mode?: Mode | null,
    lineName?: string | null,
  ): Promise<StopSchedule[]> {
    this.datasetAPI = new DatasetAPI({
      exactMatch: this.exactMatch,
      municipalityName: this.municipalityName,
      omitModeLimit: this.omitModeLimit,
      query,
      mode,
      lineName,
    });

    const stopLines = await this.getStopLines();

    const primAPI = new PrimAPI({ apiKey: this.apiKey });

    const stopSchedules = new Map<string, StopSchedule>();

    for (const stopLine of stopLines) {
      const { stopName, lineId } = stopLine;
      const stopSchedulesKey = `${lineId}-${stopName}`;

      const monitoredStopVisits = await primAPI.getStopMonitoringVisits(
        stopLine,
        mode,
      );

      if (!stopSchedules.has(stopSchedulesKey)) {
        stopSchedules.set(stopSchedulesKey, {
          stop: stopName,
          line: await this.getLine(lineId),
          directions: [],
        });
      }

      const stopSchedule = stopSchedules.get(stopSchedulesKey);
      if (stopSchedule === undefined) {
        throw new Error('error stop undefined');
      }

      const directionSchedule =
        await this.extractStopsByDestination(monitoredStopVisits);
      stopSchedule.directions.push(...directionSchedule);
    }

    return Array.from(stopSchedules.values());
  }
}

export { StopWatcher };
export type { Mode, StopSchedule };
