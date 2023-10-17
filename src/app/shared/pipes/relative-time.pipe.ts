import { Pipe, PipeTransform } from '@angular/core';

/**
 * "in 42 min", "3 h ago". Pure; callers that need a live countdown re-run it from a timer
 * (see ldg-cutoff-countdown). `now` is injectable for tests and for the fixture clock.
 */
@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, now: Date | number = Date.now()): string {
    if (!value) {
      return '';
    }
    const target = typeof value === 'string' ? new Date(value).getTime() : value.getTime();
    const reference = typeof now === 'number' ? now : now.getTime();
    const diffMinutes = Math.round((target - reference) / 60_000);
    const abs = Math.abs(diffMinutes);
    const label = abs < 1 ? 'now'
      : abs < 60 ? `${abs} min`
        : abs < 60 * 24 ? `${Math.round(abs / 60)} h`
          : `${Math.round(abs / (60 * 24))} d`;
    if (label === 'now') {
      return label;
    }
    return diffMinutes > 0 ? `in ${label}` : `${label} ago`;
  }
}
