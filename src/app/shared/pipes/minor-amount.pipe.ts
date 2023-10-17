import { inject, Pipe, PipeTransform } from '@angular/core';
import { CnCurrencyFormatService } from '@meridian/canopy-ui/core';

/**
 * Minor units in, formatted major units out. All money in the estate travels as integer minor
 * units; this is the only place in the app that divides by 100.
 *
 *   {{ approval.amountMinor | minorAmount:approval.currency }}   -> $1,250,000.00
 *   {{ delta | minorAmount:'USD':'signed' }}                     -> +$12.50
 */
@Pipe({ name: 'minorAmount', standalone: true })
export class MinorAmountPipe implements PipeTransform {
  private readonly currencyFormat = inject(CnCurrencyFormatService);

  transform(minor: number | null | undefined, currency = 'USD', mode: 'plain' | 'signed' | 'compact' = 'plain'): string {
    if (minor === null || minor === undefined || Number.isNaN(minor)) {
      return '';
    }
    const major = minor / 100;
    if (mode === 'compact') {
      return compact(major, currency);
    }
    const formatted = this.currencyFormat.format(Math.abs(major), currency);
    if (mode === 'signed') {
      return (major < 0 ? '-' : '+') + formatted;
    }
    return major < 0 ? `-${formatted}` : formatted;
  }
}

function compact(major: number, currency: string): string {
  const abs = Math.abs(major);
  const symbol = currency === 'USD' ? '$' : `${currency} `;
  const sign = major < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${symbol}${(abs / 1_000_000_000).toFixed(2)}bn`;
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(2)}m`;
  if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(1)}k`;
  return `${sign}${symbol}${abs.toFixed(2)}`;
}
