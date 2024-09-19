import axios, { type AxiosInstance } from 'axios';
import type {
  DatasetApiOptions,
  StopLineDatasetApiResponse,
  StopLineRecord,
} from '../models/dataset/StopLine';
import type {
  LineDatasetApiResponse,
  LineRecord,
} from '../models/dataset/Line';
import type { Mode } from '../models/StopWatcher';

export class DatasetAPI {
  DATASET_API_ORIGIN = 'https://data.iledefrance-mobilites.fr';
  DATASET_API_PATHNAME = '/api/records/1.0/search';
  DATASET_API_DEFAULT_PARAMS = { rows: 1000 };

  private axiosDatasetAPI: AxiosInstance;

  private readonly exactMatch: boolean;
  private readonly municipalityName: string;

  private readonly query: string | undefined;
  private readonly mode?: Mode | null;
  private readonly lineName?: string | null;

  constructor(options: DatasetApiOptions) {
    this.axiosDatasetAPI = axios.create({ baseURL: this.DATASET_API_ORIGIN });

    this.exactMatch = options.exactMatch || false;
    this.municipalityName = options.municipalityName || 'Paris';

    this.query = options.query;
    this.mode = options.mode;
    this.lineName = options.lineName;
  }

  private getStopLineParams() {
    const query = this.exactMatch
      ? { 'refine.stop_name': this.query }
      : { q: this.query };

    const mode = this.mode ? { 'refine.mode': this.mode } : {};

    const lineName = this.lineName
      ? { 'refine.route_long_name': this.lineName }
      : {};

    return {
      ...this.DATASET_API_DEFAULT_PARAMS,
      dataset: 'arrets-lignes',
      'refine.nom_commune': this.municipalityName,
      ...query,
      ...mode,
      ...lineName,
    };
  }

  async getStopLineRecords(): Promise<StopLineRecord[]> {
    const params = this.getStopLineParams();

    const response = await this.axiosDatasetAPI.get<StopLineDatasetApiResponse>(
      this.DATASET_API_PATHNAME,
      {
        params: params,
      },
    );

    return response.data.records;
  }

  private getLineParams(lineId: string) {
    return {
      ...this.DATASET_API_DEFAULT_PARAMS,
      dataset: 'referentiel-des-lignes',
      'refine.id_line': lineId,
    };
  }

  async getLineRecord(lineId: string): Promise<LineRecord> {
    const params = this.getLineParams(lineId);

    const response = await this.axiosDatasetAPI.get<LineDatasetApiResponse>(
      this.DATASET_API_PATHNAME,
      {
        params: params,
      },
    );

    if (response.data.records === undefined || !response.data.records[0]) {
      throw new Error(`No getLineInfo for ${lineId}`);
    }

    return response.data.records[0];
  }
}
