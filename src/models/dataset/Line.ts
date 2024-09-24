export interface LineRecord {
  recordid: string;
  fields: {
    name_line: string;
    transportmode: string;
    transportsubmode: string;
    textcolourweb_hexa: string;
    colourweb_hexa: string;
  };
}

export interface LineDatasetApiResponse {
  records: LineRecord[];
}
