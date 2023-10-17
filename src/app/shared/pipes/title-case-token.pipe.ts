import { Pipe, PipeTransform } from '@angular/core';

/** 'cutoff-at-risk' -> 'Cutoff at risk', 'book-transfer' -> 'Book transfer'. Enum values into labels. */
@Pipe({ name: 'titleCaseToken', standalone: true })
export class TitleCaseTokenPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const words = value.replace(/[-_.]/g, ' ').trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
}
