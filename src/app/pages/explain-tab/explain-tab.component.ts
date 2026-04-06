import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegexInputComponent } from '../../components/regex-input/regex-input.component';
import { RegexService } from '../../services/regex.service';
import { RegexToken } from '../../models/preset.model';

@Component({
  selector: 'app-explain-tab',
  standalone: true,
  imports: [CommonModule, RegexInputComponent],
  template: `
    <div class="explain-tab">
      <app-regex-input
        [externalPattern]="pattern"
        [isInvalid]="isInvalid"
        placeholder="Enter a regex to explain…"
        (patternChange)="onPatternChange($event)"
      />

      <div class="summary-panel" *ngIf="pattern && !isInvalid">
        <div class="summary-header">
          <p class="section-label">Plain English Summary <span class="summary-star">★</span></p>
          <span class="summary-badge">Quick read</span>
        </div>
        <p class="summary-copy">{{ summary }}</p>

        <div class="example-matches" *ngIf="exampleMatches.length > 0">
          <p class="example-label">Example matches:</p>
          <div class="example-list">
            <code class="example-chip" *ngFor="let example of exampleMatches">{{ example }}</code>
          </div>
        </div>
      </div>

      <div class="tokens-panel" *ngIf="tokens.length > 0">
        <p class="section-label">Detailed Breakdown</p>
        <div class="token-list">
          <div class="token-row" *ngFor="let t of tokens">
            <span class="token-chip">{{ t.token }}</span>
            <span class="arrow">→</span>
            <span class="token-exp">{{ t.explanation }}</span>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!pattern">
        <div class="empty-icon">⌘</div>
        <p>Enter a regex to see what it means</p>
      </div>

      <div class="invalid-state" *ngIf="pattern && isInvalid">
        <p>Invalid regex — please check syntax</p>
      </div>

      <div class="no-tokens" *ngIf="pattern && !isInvalid && tokens.length === 0">
        <p>No tokens found — try a more complex pattern.</p>
      </div>
    </div>
  `,
  styleUrls: ['./explain-tab.component.scss'],
})
export class ExplainTabComponent implements OnChanges {
  @Input() incomingPattern = '';
  pattern = '';
  isInvalid = false;
  tokens: RegexToken[] = [];
  summary = '';
  exampleMatches: string[] = [];

  constructor(private regexService: RegexService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incomingPattern'] && this.incomingPattern && !this.pattern) {
      this.onPatternChange(this.incomingPattern);
    }
  }

  onPatternChange(p: string): void {
    this.pattern = p;
    if (!p) {
      this.isInvalid = false;
      this.tokens = [];
      this.summary = '';
      this.exampleMatches = [];
      return;
    }
    this.isInvalid = !this.regexService.isValid(p, '');
    if (this.isInvalid) {
      this.tokens = [];
      this.summary = '';
      this.exampleMatches = [];
      return;
    }

    const translated = this.regexService.summarize(p);
    this.summary = translated.summary;
    this.exampleMatches = translated.examples;
    this.tokens = this.regexService.explain(p);
  }
}
