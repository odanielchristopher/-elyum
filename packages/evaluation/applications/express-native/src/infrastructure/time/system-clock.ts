import type { Clock } from '../../application/contracts/clock';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
