import { Component } from '@angular/core';
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

      <div class="tokens-panel" *ngIf="tokens.length > 0">
        <p class="section-label">Breakdown</p>
        <div class="token-list">
          <div class="token-row" *ngFor="let t of tokens; let i = index">
            <span class="token-chip" [style.animationDelay]="i * 40 + 'ms'">{{ t.token }}</span>
            <span class="arrow">→</span>
            <span class="token-exp">{{ t.explanation }}</span>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!pattern">
        <div class="empty-icon">⌘</div>
        <p>Enter a regex above to see a step-by-step explanation of each component.</p>
      </div>

      <div class="invalid-state" *ngIf="pattern && isInvalid">
        <p>Fix the regex syntax to see its explanation.</p>
      </div>

      <div class="no-tokens" *ngIf="pattern && !isInvalid && tokens.length === 0">
        <p>No tokens found — try a more complex pattern.</p>
      </div>
    </div>
  `,
  styleUrls: ['./explain-tab.component.scss'],
})
export class ExplainTabComponent {
  pattern = '';
  isInvalid = false;
  tokens: RegexToken[] = [];

  constructor(private regexService: RegexService) {}

  onPatternChange(p: string): void {
    this.pattern = p;
    if (!p) { this.isInvalid = false; this.tokens = []; return; }
    this.isInvalid = !this.regexService.isValid(p, '');
    this.tokens = this.isInvalid ? [] : this.regexService.explain(p);
  }
}
