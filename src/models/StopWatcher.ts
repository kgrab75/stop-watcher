import type { StopWatcher } from '../StopWatcher';

export type Mode = (typeof StopWatcher.MODE)[keyof typeof StopWatcher.MODE];

export interface StopWatcherOptions {
  apiKey: string;
  asDate?: boolean;
  exactMatch?: boolean;
  locale?: string;
  municipalityName?: string;
  omitModeLimit?: number;
}
