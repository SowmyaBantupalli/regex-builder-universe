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
        <span class="field-label">Output</span>
        <span class="match-badge has-matches" *ngIf="hasPattern && hasText && !isInvalid && matchCount > 0">
          {{ matchCount }} {{ matchCount === 1 ? 'match' : 'matches' }} found
        </span>
        <span class="match-badge no-matches" *ngIf="hasPattern && hasText && !isInvalid && matchCount === 0">
          No matches
        </span>
        <span class="match-badge" *ngIf="!hasPattern || !hasText || isInvalid">—</span>
      </div>
      <div class="highlight-output">
        <ng-container *ngIf="segments.length > 0; else emptyState">
          <span
            *ngFor="let seg of segments"
            class="segment"
            [class.match]="seg.isMatch"
          >{{ seg.text }}</span>
        </ng-container>
        <ng-template #emptyState>
          <span class="empty-hint" *ngIf="!hasPattern">Enter a regex or choose a preset</span>
          <span class="empty-hint" *ngIf="hasPattern && !hasText">Enter test text above</span>
          <span class="empty-hint" *ngIf="hasPattern && hasText">No segments to display</span>
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
  @Input() isInvalid = false;
}
