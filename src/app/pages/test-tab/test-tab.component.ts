import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegexInputComponent } from '../../components/regex-input/regex-input.component';
import { TextInputComponent } from '../../components/text-input/text-input.component';
import { HighlightViewComponent } from '../../components/highlight-view/highlight-view.component';
import { PresetDropdownComponent } from '../../components/preset-dropdown/preset-dropdown.component';
import { RegexService } from '../../services/regex.service';
import { RegexDraft, RegexPreset, MatchResult, RegexToken } from '../../models/preset.model';

interface Sample {
  name: string;
  description: string;
  regex: string;
  flags: string;
  text: string;
}

const SAMPLES: Sample[] = [
  {
    name: 'Numbers Only',
    description: 'Matches lines that contain digits and nothing else.',
    regex: '^\\d+$',
    flags: 'gm',
    text: 'Order 123\nOrder ABC\n456',
  },
  {
    name: 'Email',
    description: 'Checks for a simple email structure with text before and after @.',
    regex: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    flags: 'gm',
    text: 'test@example.com\ninvalid@email\nuser@domain.com',
  },
  {
    name: 'Date (YYYY-MM-DD)',
    description: 'Matches ISO-style dates with four-digit year, month, and day.',
    regex: '^\\d{4}-\\d{2}-\\d{2}$',
    flags: 'gm',
    text: '2025-01-01\n01-01-2025\n2024-12-31',
  },
  {
    name: 'Words',
    description: 'Finds alphabetic words without digits or underscores.',
    regex: '[a-zA-Z]+',
    flags: 'g',
    text: 'Hello 123 World\nTest_case',
  },
  {
    name: 'Phone Number',
    description: 'Matches 10-digit phone numbers on their own line.',
    regex: '^\\d{10}$',
    flags: 'gm',
    text: '9876543210\n12345\n9998887776',
  },
];

@Component({
  selector: 'app-test-tab',
  standalone: true,
  imports: [
    CommonModule,
    RegexInputComponent,
    TextInputComponent,
    HighlightViewComponent,
    PresetDropdownComponent,
  ],
  template: `
    <div class="test-tab">
      <div class="helper-banner" *ngIf="!pattern">
        <span class="helper-icon">💡</span>
        <span>Try a sample or enter your own regex to get started</span>
      </div>

      <div class="workspace-grid">
        <section class="workspace-card input-card">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Regex</p>
              <h3>Build and test instantly</h3>
            </div>
            <span class="mini-chip" *ngIf="activeSample">{{ activeSample.name }}</span>
            <span class="mini-chip" *ngIf="selectedPreset">{{ selectedPreset.name }}</span>
          </div>

          <div class="top-row">
            <div class="regex-row">
              <app-regex-input
                [externalPattern]="pattern"
                [externalFlags]="flags"
                [isInvalid]="isInvalid"
                (patternChange)="onPatternChange($event)"
                (flagsChange)="onFlagsChange($event)"
              />
            </div>
            <div class="action-row">
              <app-preset-dropdown
                [selectedPreset]="selectedPreset"
                (presetSelected)="onPresetSelected($event)"
              />

              <div class="sample-dropdown" [class.open]="showSamples" #sampleRef>
                <button class="sample-trigger" type="button" (click)="toggleSamples()">
                  <span>Try Sample</span>
                  <span class="chevron" [class.flipped]="showSamples">▾</span>
                </button>
                <div class="sample-panel" *ngIf="showSamples">
                  <button
                    *ngFor="let s of samples"
                    class="sample-item"
                    type="button"
                    [class.active]="activeSample?.name === s.name"
                    (click)="loadSample(s)"
                  >
                    <span class="sample-item__name">{{ s.name }}</span>
                    <span class="sample-item__desc">{{ s.description }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="error-banner" *ngIf="isInvalid">
            <span class="error-icon">⚠</span>
            Invalid regex — check for missing brackets or symbols
          </div>

          <div class="selected-info" *ngIf="activeContextLabel && !isInvalid">
            <span class="info-label">{{ activeContextLabel }}</span>
            <span class="info-desc">{{ activeContextDescription }}</span>
          </div>

          <app-text-input
            [externalValue]="testText"
            (textChange)="onTextChange($event)"
          />
        </section>

        <section class="workspace-card output-card">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Results</p>
              <h3>Match feedback</h3>
            </div>
            <span class="results-meta" *ngIf="pattern && !isInvalid">
              {{ matchCount }} {{ matchCount === 1 ? 'match' : 'matches' }} found
            </span>
          </div>

          <app-highlight-view
            [segments]="segments"
            [matchCount]="matchCount"
            [hasPattern]="!!pattern"
            [hasText]="!!testText"
            [isInvalid]="isInvalid"
          />
        </section>

        <section class="workspace-card explanation-card">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Explain</p>
              <h3>Readable regex breakdown</h3>
            </div>
          </div>

          <div class="explanation-empty" *ngIf="!pattern">
            Enter a regex or choose a preset
          </div>

          <div class="explanation-empty" *ngIf="pattern && isInvalid">
            Invalid regex — check for missing brackets or symbols
          </div>

          <div class="explanation-list" *ngIf="pattern && !isInvalid && tokens.length > 0">
            <div class="explanation-row" *ngFor="let token of tokens">
              <code class="token-chip">{{ token.token }}</code>
              <span class="token-arrow">→</span>
              <span class="token-copy">{{ token.explanation }}</span>
            </div>
          </div>

          <div class="explanation-empty" *ngIf="pattern && !isInvalid && tokens.length === 0">
            Add a more specific pattern to see its parts explained.
          </div>
        </section>
      </div>
    </div>
  `,
  styleUrls: ['./test-tab.component.scss'],
})
export class TestTabComponent implements OnInit, OnChanges {
  @Input() incomingPreset: RegexPreset | null = null;
  @Input() incomingDraft: RegexDraft | null = null;

  pattern = '';
  flags = 'g';
  testText = '';
  segments: MatchResult[] = [];
  matchCount = 0;
  tokens: RegexToken[] = [];
  isInvalid = false;
  selectedPreset: RegexPreset | null = null;

  showSamples = false;
  activeSample: Sample | null = null;
  samples = SAMPLES;

  constructor(private regexService: RegexService, private elRef: ElementRef) {}

  ngOnInit(): void {
    this.update();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incomingPreset'] && this.incomingPreset) {
      this.activeSample = null;
      this.onPresetSelected(this.incomingPreset);
    }
    if (changes['incomingDraft'] && this.incomingDraft) {
      this.loadDraft(this.incomingDraft);
    }
  }

  toggleSamples(): void {
    this.showSamples = !this.showSamples;
  }

  loadSample(s: Sample): void {
    this.activeSample = s;
    this.selectedPreset = null;
    this.pattern = s.regex;
    this.flags = s.flags;
    this.testText = s.text;
    this.showSamples = false;
    this.update();
  }

  onPatternChange(p: string): void {
    this.pattern = p;
    this.selectedPreset = null;
    this.activeSample = null;
    this.update();
  }

  onFlagsChange(f: string): void {
    this.flags = f;
    this.update();
  }

  onTextChange(t: string): void {
    this.testText = t;
    this.update();
  }

  onPresetSelected(p: RegexPreset): void {
    this.selectedPreset = p;
    this.activeSample = null;
    this.pattern = p.regex;
    this.flags = p.flags || 'g';
    this.testText = p.example;
    this.update();
  }

  loadDraft(draft: RegexDraft): void {
    this.selectedPreset = null;
    this.activeSample = null;
    this.pattern = draft.regex;
    this.flags = draft.flags || 'gm';
    this.testText = draft.text;
    this.update();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (this.showSamples && !this.elRef.nativeElement.querySelector('.sample-dropdown')?.contains(e.target)) {
      this.showSamples = false;
    }
  }

  private update(): void {
    if (!this.pattern) {
      this.isInvalid = false;
      this.segments = [];
      this.matchCount = 0;
      this.tokens = [];
      return;
    }
    this.isInvalid = !this.regexService.isValid(this.pattern, this.flags);
    if (this.isInvalid) {
      this.segments = [];
      this.matchCount = 0;
      this.tokens = [];
      return;
    }
    this.segments = this.regexService.getMatches(this.pattern, this.flags, this.testText);
    this.matchCount = this.regexService.countMatches(this.pattern, this.flags, this.testText);
    this.tokens = this.regexService.explain(this.pattern);
  }

  get activeContextLabel(): string {
    return this.activeSample?.name ?? this.selectedPreset?.name ?? '';
  }

  get activeContextDescription(): string {
    return this.activeSample?.description ?? this.selectedPreset?.description ?? '';
  }
}
