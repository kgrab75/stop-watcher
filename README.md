# StopWatcher NPM Package

## Overview

The `StopWatcher` class helps monitor public transport stops and retrieve real-time information about the next stops for different transport lines. It integrates with APIs from Île-de-France Mobilités to get data about bus, metro, tramway, and other public transport modes in the Île-de-France region.

> [!IMPORTANT]
>
> This is not an official package from Île-de-France Mobilités. It is a custom-built solution designed to interact with their publicly available APIs.

## Installation

To install the package, use:

```bash
npm install @kgrab75/stop-watcher
```

## Usage

### Importing the StopWatcher

```typescript
import { StopWatcher } from '@kgrab75/stop-watcher';
```

### Constructor

The `StopWatcher` class is initialized with an options object, where the only mandatory field is `apiKey`.

```typescript
const stopWatcher = new StopWatcher({
  apiKey: 'your-api-key',
  locale: 'en', // Optional: defaults to 'fr'
  asDate: true, // Optional: defaults to false
  exactMatch: true, // Optional: defaults to false
  municipalityName: 'Paris', // Optional: defaults to 'Paris'
});
```

#### Options

- `apiKey` (string): Required. Your API key generated from [Île-de-France Mobilités](https://connect.iledefrance-mobilites.fr/auth).
- `locale` (string): Optional. The locale for relative date formatting, default is `'fr'`.
- `asDate` (boolean): Optional. If `true`, dates are returned as `Date` objects. Default is `false`.
- `exactMatch` (boolean): Optional. If `true`, matches stops exactly. Default is `false`.
- `municipalityName` (string): Optional. The name of the municipality to search for stops. Default is `'Paris'`.

## Examples

Here are some practical examples of using the `StopWatcher` to retrieve information for different transport modes:

### 3. Get Metro Line 8 stops at Michel Bizot

This example retrieves the next stops for the **Metro Line 8** at **Michel Bizot**.

```typescript
const apiKey = 'Get yours here: https://prim.iledefrance-mobilites.fr/';
const stopWatcher = new StopWatcher({
  apiKey,
});

const stopSchedules = stopWatcher.getStopSchedules(
  'Michel Bizot',
  StopWatcher.MODE.METRO,
  '8',
);

console.log(stopSchedules);
```

```json
[
  {
    "stop": "Michel Bizot",
    "lineInfo": {
      "name": "8",
      "color": "d282be",
      "textColor": "000000",
      "mode": "Metro"
    },
    "directions": [
      {
        "name": "Pointe du Lac",
        "upcomingDepartures": [
          {
            "destination": "Créteil-Pointe du Lac",
            "next": "dans 3 min"
          },
          {
            "destination": "Créteil-Pointe du Lac",
            "next": "dans 7 min"
          }
        ]
      },
      {
        "name": "Balard",
        "upcomingDepartures": [
          {
            "destination": "Balard",
            "next": "dans 2 min"
          },
          {
            "destination": "Balard",
            "next": "dans 7 min"
          }
        ]
      }
    ]
  }
]
```

### 2. Get RER A stops at Nation

This example retrieves the next stops for the **RER A** line at the **Nation** station.

```typescript
await stopWatcher.getStopSchedules('Nation', StopWatcher.MODE.RER, 'A');
```

### 3. Get Bus 46 stops at Sidi Brahim

This example retrieves the next stops for the **Bus 46** line at **Sidi Brahim**.

```typescript
await stopWatcher.getStopSchedules('Sidi Brahim', StopWatcher.MODE.BUS, '46');
```

In each of these examples, the `getStopSchedules` method returns a `Promise<StopSchedule[]>`, where each element contains details about the next stops for the specified query, transport mode, and line.

## Methods

### getLine(lineId: string)

Fetches information about a specific line, including the name, color, textColor, and transport mode.

```typescript
const line = await stopWatcher.getLine('lineId');
```

Returns a `Promise<Line>` containing:

- `name` (string): Line name.
- `color` (string): Hex color code for the line.
- `textColor` (string): Hex color code for the text.
- `mode` (Mode): The mode of transport (Bus, Metro, Tramway, etc.).

### getStopSchedules(query: string, mode?: Mode, lineName?: string)

Retrieves the next stops for a given query, mode, or line name.

```typescript
const stopSchedules = await stopWatcher.getStopSchedules(
  'stopName',
  'Bus',
  'lineName',
);
```

Returns a `Promise<NextStopInfo[]>` with details about the next stops, including:

- `direction` (string): The direction of the line.
- `stop` (string): The stop name.
- `nextStops` (NextStop[]): Array of upcoming stops with their destination and expected time.
- `lineInfo` (LineInfo): Information about the line.

## Types

### `StopWatcherOptions`

The options object for initializing `StopWatcher`.

```typescript
type StopWatcherOptions = {
  apiKey: string;
  locale?: string;
  asDate?: boolean;
  exactMatch?: boolean;
  municipalityName?: string;
};
```

### `Line`

Represents a transportation line.

```typescript
interface Line {
  name: string;
  color: string;
  textColor: string;
  mode?: Mode;
}
```

- **name**: The name of the line.
- **color**: The color code of the line (in hexadecimal).
- **textColor**: The text color code (in hexadecimal) for better contrast.
- **mode**: The mode of transportation, which can be a bus, metro, tram, or train (optional).

### `Departure`

Represents a departure for a specific destination.

```typescript
interface Departure {
  destination: string;
  next: Date | string;
}
```

- **destination**: The name of the destination stop.
- **next**: The time of the next departure.

### `DirectionSchedule`

Represents the schedule of departures in a specific direction.

```typescript
interface DirectionSchedule {
  name: string;
  upcomingDepartures: Departure[];
}
```

- **name**: The name of the direction (e.g., the name of the terminal station).
- **upcomingDepartures**: A list of upcoming departures (`Departure[]`) for this direction.

### `StopSchedule`

Represents the schedule of a particular stop, including its lines and departure directions.

```typescript
interface StopSchedule {
  stop: string;
  line: Line;
  directions: DirectionSchedule[];
}
```

- **stop**: The name of the stop.
- **line**: The `Line` information of the transportation serving the stop.
- **directions**: A list of `DirectionSchedule[]` for each direction served by the stop.

## Constants

### MODE

A static object that defines the different modes of transport.

```typescript
StopWatcher.MODE = {
  BUS: 'Bus',
  METRO: 'Metro',
  TRAM: 'Tramway',
  RER: 'RapidTransit',
  TRANSILIEN: 'LocalTrain',
};
```
