Here is the documentation for your NPM package, written in English and formatted in Markdown:

---

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

const nextStops = stopWatcher.getNextStops(
  'Michel Bizot',
  StopWatcher.MODE.METRO,
  '8',
);

console.log(nextStops);
```

```json
[
  {
    "direction": "Pointe du Lac",
    "stop": "Michel Bizot",
    "nextStops": [
      {
        "destination": "Créteil-Pointe du Lac",
        "next": "dans 3 min"
      },
      {
        "destination": "Créteil-Pointe du Lac",
        "next": "dans 6 min"
      }
      //...
    ],
    "lineInfo": {
      "name": "8",
      "color": "d282be",
      "transport": "metro"
    }
  },
  {
    "direction": "Balard",
    "stop": "Michel Bizot",
    "nextStops": [
      {
        "destination": "Balard",
        "next": "dans 2 min"
      },
      {
        "destination": "Balard",
        "next": "dans 6 min"
      }
      //...
    ],
    "lineInfo": {
      "name": "8",
      "color": "d282be",
      "transport": "metro"
    }
  }
]
```

### 2. Get RER A stops at Nation

This example retrieves the next stops for the **RER A** line at the **Nation** station.

```typescript
await stopWatcher.getNextStops('Nation', StopWatcher.MODE.RER, 'A');
```

### 3. Get Bus 46 stops at Sidi Brahim

This example retrieves the next stops for the **Bus 46** line at **Sidi Brahim**.

```typescript
await stopWatcher.getNextStops('Sidi Brahim', StopWatcher.MODE.BUS, '46');
```

In each of these examples, the `getNextStops` method returns a `Promise<NextStopInfo[]>`, where each element contains details about the next stops for the specified query, transport mode, and line.

## Methods

### getLineInfo(lineId: string)

Fetches information about a specific line, including the name, color, and transport mode.

```typescript
const lineInfo = await stopWatcher.getLineInfo('lineId');
```

Returns a `Promise<LineInfo>` containing:

- `name` (string): Line name.
- `color` (string): Hex color code for the line.
- `transport` (string): The mode of transport (Bus, Metro, Tramway, etc.).

### getNextStops(query: string, mode?: Mode, lineName?: string)

Retrieves the next stops for a given query, mode, or line name.

```typescript
const nextStops = await stopWatcher.getNextStops('stopName', 'Bus', 'lineName');
```

Returns a `Promise<NextStopInfo[]>` with details about the next stops, including:

- `direction` (string): The direction of the line.
- `stop` (string): The stop name.
- `nextStops` (NextStop[]): Array of upcoming stops with their destination and expected time.
- `lineInfo` (LineInfo): Information about the line.

## Types

### StopWatcherOptions

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

### NextStop

Represents the next stop details.

```typescript
type NextStop = {
  destination: string;
  next: Date | string;
};
```

### LineInfo

Contains information about the transport line.

```typescript
type LineInfo = {
  name: string;
  color: string;
  transport: string;
};
```

### NextStopInfo

Represents information about the next stops for a specific direction.

```typescript
interface NextStopInfo {
  direction: string;
  stop: string;
  nextStops: NextStop[];
  lineInfo: LineInfo;
}
```

## Constants

### MODE

A static object that defines the different modes of transport.

```typescript
StopWatcher.MODE = {
  BUS: 'Bus',
  METRO: 'Metro',
  TRAM: 'Tramway',
  RER: 'RapidTransit',
  TER: 'LocalTrain',
};
```

## Error Handling

If `apiKey` is not provided during initialization, an error is thrown:

```typescript
throw new Error(
  'apiKey is mandatory! You can generate this apikey by signing up here: https://prim.iledefrance-mobilites.fr/',
);
```
