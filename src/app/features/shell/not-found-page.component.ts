import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CnButtonModule } from '@meridian/canopy-ui/actions';

@Component({
  selector: 'ldg-not-found-page',
  standalone: true,
  imports: [RouterLink, CnButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ldg-state-page" aria-labelledby="ldg-nf-title">
      <h1 id="ldg-nf-title">There is nothing at this address</h1>
      <p class="ldg-muted">If you followed a link from an approval email older than 2024-06 the paths changed (LDG-1102).</p>
      <cn-button variant="secondary" routerLink="/">Go to the dashboard</cn-button>
    </section>
  `
})
export class NotFoundPageComponent {}
