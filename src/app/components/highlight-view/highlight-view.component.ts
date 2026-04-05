import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchResult } from '../../models/preset.model';

@Component({
  selector: 'app-highlight-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="highlight-view">
      <div class="highlight-header">
        <span class="field-label">Matches</span>
        <span class="match-badge" [class.has-matches]="matchCount > 0" *ngIf="hasPattern && hasText">
          {{ matchCount }} {{ matchCount === 1 ? 'match' : 'matches' }} found
        </span>
        <span class="match-badge" *ngIf="!hasPattern || !hasText">—</span>
      </div>
      <div class="highlight-output">
        <ng-container *ngIf="segments.length > 0; else emptyState">
          <span
            *ngFor="let seg of segments"
            [class.match]="seg.isMatch"
          >{{ seg.text }}</span>
        </ng-container>
        <ng-template #emptyState>
          <span class="empty-hint">Try a preset or type your own regex</span>
        </ng-template>
      </div>
    </div>
  `,
  styleUrls: ['./highlight-view.component.scss'],
})
export class HighlightViewComponent {
  @Input() segments: MatchResult[] = [];
  @Input() matchCount = 0;
  @Input() hasPattern = false;
  @Input() hasText = false;
}
