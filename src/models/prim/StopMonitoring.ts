export interface PrimApiOptions {
  apiKey: string;
}

export interface MonitoredStopVisit {
  RecordedAtTime: string;
  ItemIdentifier: string;
  MonitoringRef: {
    value: string;
  };
  MonitoredVehicleJourney: {
    LineRef: {
      value: string;
    };
    OperatorRef: {
      value: string;
    };
    FramedVehicleJourneyRef: {
      DataFrameRef: {
        value: string;
      };
      DatedVehicleJourneyRef: string;
    };
    DirectionName: {
      value: string;
    }[];
    DestinationRef: {
      value: string;
    };
    DestinationName: {
      value: string;
    }[];
    VehicleJourneyName: any[];
    JourneyNote: any[];
    MonitoredCall: {
      StopPointName: {
        value: string;
      }[];
      VehicleAtStop: boolean;
      DestinationDisplay: {
        value: string;
      }[];
      ExpectedArrivalTime?: string;
      ExpectedDepartureTime?: string;
      AimedArrivalTime?: string;
      AimedDepartureTime?: string;
      DepartureStatus: string;
      ArrivalStatus: string;
    };
    TrainNumbers: {
      TrainNumberRef: any[];
    };
  };
}

export interface StopMonitoringDelivery {
  MonitoredStopVisit: MonitoredStopVisit[];
}

export interface StopMonitoringPrimApiResponse {
  Siri: {
    ServiceDelivery: { StopMonitoringDelivery: StopMonitoringDelivery[] };
  };
}
