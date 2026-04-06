import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegexDraft, RegexToken } from '../../models/preset.model';
import { RegexService } from '../../services/regex.service';

type PatternType = 'numbers' | 'letters' | 'alphanumeric' | 'email' | 'date' | 'custom';
type LengthMode = 'any' | 'exact' | 'range';
type LetterCase = 'any' | 'lower' | 'upper';

@Component({
  selector: 'app-build-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="build-tab">
      <section class="builder-card">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Builder</p>
            <h3>What do you want to match?</h3>
          </div>
        </div>

        <div class="control-grid">
          <label class="field">
            <span class="field-label">Pattern type</span>
            <select class="field-input" [(ngModel)]="patternType" (ngModelChange)="updateGenerated()">
              <option value="numbers">Numbers only</option>
              <option value="letters">Letters only</option>
              <option value="alphanumeric">Alphanumeric</option>
              <option value="email">Email</option>
              <option value="date">Date</option>
              <option value="custom">Custom</option>
            </select>
          </label>
        </div>

        <div class="options-panel">
          <div class="option-group" *ngIf="usesLengthOptions">
            <label class="field">
              <span class="field-label">Length rule</span>
              <select class="field-input" [(ngModel)]="lengthMode" (ngModelChange)="updateGenerated()">
                <option value="any">Any length</option>
                <option value="exact">Exact length</option>
                <option value="range">Min / max</option>
              </select>
            </label>

            <label class="field" *ngIf="lengthMode === 'exact'">
              <span class="field-label">Exact length</span>
              <input class="field-input" type="number" min="1" [(ngModel)]="exactLength" (ngModelChange)="updateGenerated()" />
            </label>

            <label class="field" *ngIf="lengthMode === 'range'">
              <span class="field-label">Min length</span>
              <input class="field-input" type="number" min="1" [(ngModel)]="minLength" (ngModelChange)="updateGenerated()" />
            </label>

            <label class="field" *ngIf="lengthMode === 'range'">
              <span class="field-label">Max length</span>
              <input class="field-input" type="number" min="1" [(ngModel)]="maxLength" (ngModelChange)="updateGenerated()" />
            </label>
          </div>

          <div class="option-group" *ngIf="patternType === 'numbers'">
            <label class="toggle-row">
              <input type="checkbox" [(ngModel)]="allowSpaces" (ngModelChange)="updateGenerated()" />
              <span>Allow spaces</span>
            </label>
          </div>

          <div class="option-group" *ngIf="patternType === 'letters'">
            <label class="field">
              <span class="field-label">Letter case</span>
              <select class="field-input" [(ngModel)]="letterCase" (ngModelChange)="updateGenerated()">
                <option value="any">Any letters</option>
                <option value="lower">Lowercase only</option>
                <option value="upper">Uppercase only</option>
              </select>
            </label>
          </div>

          <div class="option-group option-group--stack" *ngIf="patternType === 'custom'">
            <label class="field">
              <span class="field-label">Starts with</span>
              <input class="field-input" type="text" [(ngModel)]="startsWith" (ngModelChange)="updateGenerated()" />
            </label>

            <label class="field">
              <span class="field-label">Contains</span>
              <input class="field-input" type="text" [(ngModel)]="containsText" (ngModelChange)="updateGenerated()" />
            </label>

            <label class="field">
              <span class="field-label">Ends with</span>
              <input class="field-input" type="text" [(ngModel)]="endsWith" (ngModelChange)="updateGenerated()" />
            </label>
          </div>
        </div>

        <div class="error-banner" *ngIf="errorMessage">
          Invalid combination of rules
        </div>
      </section>

      <section class="builder-card">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Result</p>
            <h3>Generated regex</h3>
          </div>
          <button class="primary-button" type="button" [disabled]="!canTest" (click)="sendToTest()">
            Test this regex
          </button>
        </div>

        <div class="result-box" [class.is-disabled]="!generatedRegex">
          <code>{{ generatedRegex || 'Choose a pattern to generate regex' }}</code>
        </div>

        <div class="preview-grid" *ngIf="generatedRegex && !errorMessage">
          <div class="preview-card">
            <p class="preview-label">Example matches</p>
            <code class="preview-chip" *ngFor="let valid of validExamples">{{ valid }}</code>
          </div>

          <div class="preview-card">
            <p class="preview-label">Example invalid values</p>
            <code class="preview-chip preview-chip--muted" *ngFor="let invalid of invalidExamples">{{ invalid }}</code>
          </div>
        </div>
      </section>

      <section class="builder-card" *ngIf="generatedRegex && !errorMessage">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Explain</p>
            <h3>What this regex does</h3>
          </div>
        </div>

        <div class="summary-panel">
          <p class="summary-copy">{{ summary }}</p>
        </div>

        <div class="token-list" *ngIf="tokens.length > 0">
          <div class="token-row" *ngFor="let token of tokens">
            <code class="token-chip">{{ token.token }}</code>
            <span class="token-arrow">→</span>
            <span class="token-copy">{{ token.explanation }}</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['./build-tab.component.scss'],
})
export class BuildTabComponent {
  @Output() testRequested = new EventEmitter<RegexDraft>();

  patternType: PatternType = 'numbers';
  lengthMode: LengthMode = 'any';
  exactLength: number | null = 5;
  minLength: number | null = 3;
  maxLength: number | null = 8;
  allowSpaces = false;
  letterCase: LetterCase = 'any';
  startsWith = '';
  containsText = '';
  endsWith = '';

  generatedRegex = '';
  summary = '';
  tokens: RegexToken[] = [];
  validExamples: string[] = [];
  invalidExamples: string[] = [];
  errorMessage = '';

  constructor(private regexService: RegexService) {
    this.updateGenerated();
  }

  get usesLengthOptions(): boolean {
    return this.patternType === 'numbers' || this.patternType === 'letters' || this.patternType === 'alphanumeric';
  }

  get canTest(): boolean {
    return !!this.generatedRegex && !this.errorMessage;
  }

  updateGenerated(): void {
    const build = this.buildRegexFromOptions();
    this.generatedRegex = build.regex;
    this.validExamples = build.validExamples;
    this.invalidExamples = build.invalidExamples;
    this.errorMessage = build.error;

    if (!this.generatedRegex || this.errorMessage) {
      this.summary = '';
      this.tokens = [];
      return;
    }

    const translated = this.regexService.summarize(this.generatedRegex);
    this.summary = translated.summary;
    this.tokens = this.regexService.explain(this.generatedRegex);
  }

  sendToTest(): void {
    if (!this.canTest) return;

    const text = [...this.validExamples, ...this.invalidExamples].join('\n');
    this.testRequested.emit({
      name: `Builder: ${this.labelForPatternType()}`,
      regex: this.generatedRegex,
      flags: 'gm',
      text,
      description: this.summary,
    });
  }

  private buildRegexFromOptions(): { regex: string; validExamples: string[]; invalidExamples: string[]; error: string } {
    switch (this.patternType) {
      case 'numbers':
        return this.buildNumbersRegex();
      case 'letters':
        return this.buildLettersRegex();
      case 'alphanumeric':
        return this.buildAlphanumericRegex();
      case 'email':
        return {
          regex: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          validExamples: ['test@example.com', 'user@domain.com'],
          invalidExamples: ['invalid@email', 'hello world'],
          error: '',
        };
      case 'date':
        return {
          regex: '^\\d{4}-\\d{2}-\\d{2}$',
          validExamples: ['2025-01-01', '2024-12-31'],
          invalidExamples: ['01-01-2025', '2025/01/01'],
          error: '',
        };
      case 'custom':
        return this.buildCustomRegex();
      default:
        return { regex: '', validExamples: [], invalidExamples: [], error: 'invalid' };
    }
  }

  private buildNumbersRegex(): { regex: string; validExamples: string[]; invalidExamples: string[]; error: string } {
    const core = this.allowSpaces ? '[\\d ]' : '\\d';
    const quantifier = this.resolveQuantifier();
    if (!quantifier) return { regex: '', validExamples: [], invalidExamples: [], error: 'invalid' };

    const regex = `^${core}${quantifier}$`;
    const validBase = this.allowSpaces ? '12 34 5' : '12345';
    return {
      regex,
      validExamples: this.examplesForLength(validBase.replace(/ /g, this.allowSpaces ? ' ' : ''), this.allowSpaces),
      invalidExamples: this.allowSpaces ? ['123', 'abc 12'] : ['123', 'abc'],
      error: '',
    };
  }

  private buildLettersRegex(): { regex: string; validExamples: string[]; invalidExamples: string[]; error: string } {
    const charClass = this.letterCase === 'lower' ? '[a-z]' : this.letterCase === 'upper' ? '[A-Z]' : '[a-zA-Z]';
    const quantifier = this.resolveQuantifier();
    if (!quantifier) return { regex: '', validExamples: [], invalidExamples: [], error: 'invalid' };

    const regex = `^${charClass}${quantifier}$`;
    const valid = this.letterCase === 'lower' ? ['hello', 'world'] : this.letterCase === 'upper' ? ['HELLO', 'WORLD'] : ['Hello', 'Regex'];
    const invalid = this.letterCase === 'lower' ? ['Hello', '123'] : this.letterCase === 'upper' ? ['Hello', '123'] : ['abc123', '123'];
    return { regex, validExamples: valid, invalidExamples: invalid, error: '' };
  }

  private buildAlphanumericRegex(): { regex: string; validExamples: string[]; invalidExamples: string[]; error: string } {
    const quantifier = this.resolveQuantifier();
    if (!quantifier) return { regex: '', validExamples: [], invalidExamples: [], error: 'invalid' };

    return {
      regex: `^[a-zA-Z0-9]${quantifier}$`,
      validExamples: ['Code123', 'A1B2C3'],
      invalidExamples: ['abc-123', 'hello world'],
      error: '',
    };
  }

  private buildCustomRegex(): { regex: string; validExamples: string[]; invalidExamples: string[]; error: string } {
    if (!this.startsWith && !this.containsText && !this.endsWith) {
      return { regex: '', validExamples: [], invalidExamples: [], error: 'invalid' };
    }

    const start = this.startsWith ? this.escapeRegex(this.startsWith) : '';
    const middle = this.containsText ? `.*${this.escapeRegex(this.containsText)}.*` : '.*';
    const end = this.endsWith ? this.escapeRegex(this.endsWith) : '';
    const regex = `^${start}${middle}${end}$`;

    const valid = `${this.startsWith || 'pre'}${this.containsText || 'core'}${this.endsWith || 'end'}`;
    const invalid = `${this.startsWith || 'pre'}${this.endsWith || 'end'}`;

    return {
      regex,
      validExamples: [valid, `${this.startsWith || 'a'}${this.containsText || 'middle'}${this.endsWith || 'z'}`],
      invalidExamples: this.containsText ? [invalid, 'nomatch'] : ['nomatch', '123'],
      error: '',
    };
  }

  private resolveQuantifier(): string | null {
    if (this.lengthMode === 'any') return '+';

    if (this.lengthMode === 'exact') {
      if (!this.exactLength || this.exactLength < 1) return null;
      return `{${this.exactLength}}`;
    }

    if (!this.minLength || !this.maxLength || this.minLength < 1 || this.maxLength < this.minLength) {
      return null;
    }

    return `{${this.minLength},${this.maxLength}}`;
  }

  private examplesForLength(base: string, spaced: boolean): string[] {
    if (this.lengthMode === 'exact' && this.exactLength) {
      const char = spaced ? '1' : '1';
      const example = spaced ? this.padWithOptionalSpace(this.exactLength) : char.repeat(this.exactLength);
      return [example, example.replace(/1/g, '9')];
    }

    if (this.lengthMode === 'range' && this.minLength && this.maxLength) {
      const first = spaced ? this.padWithOptionalSpace(this.minLength) : '1'.repeat(this.minLength);
      const second = spaced ? this.padWithOptionalSpace(this.maxLength) : '9'.repeat(this.maxLength);
      return [first, second];
    }

    return spaced ? ['12 34', '987 65'] : [base, '987654'];
  }

  private padWithOptionalSpace(length: number): string {
    return '1'.repeat(length).replace(/(.{2})/g, '$1 ').trim();
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private labelForPatternType(): string {
    switch (this.patternType) {
      case 'numbers': return 'Numbers only';
      case 'letters': return 'Letters only';
      case 'alphanumeric': return 'Alphanumeric';
      case 'email': return 'Email';
      case 'date': return 'Date';
      case 'custom': return 'Custom';
    }
  }
}
