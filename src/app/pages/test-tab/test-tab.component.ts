import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegexInputComponent } from '../../components/regex-input/regex-input.component';
import { TextInputComponent } from '../../components/text-input/text-input.component';
import { HighlightViewComponent } from '../../components/highlight-view/highlight-view.component';
import { PresetDropdownComponent } from '../../components/preset-dropdown/preset-dropdown.component';
import { RegexService } from '../../services/regex.service';
import { RegexPreset, MatchResult } from '../../models/preset.model';

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
        <div class="preset-row">
          <app-preset-dropdown
            [selectedPreset]="selectedPreset"
            (presetSelected)="onPresetSelected($event)"
          />
        </div>
      </div>

      <div class="selected-info" *ngIf="selectedPreset">
        <span class="info-label">{{ selectedPreset.name }}</span>
        <span class="info-desc">{{ selectedPreset.description }}</span>
      </div>

      <app-text-input
        [externalValue]="testText"
        (textChange)="onTextChange($event)"
      />

      <app-highlight-view
        [segments]="segments"
        [matchCount]="matchCount"
        [hasPattern]="!!pattern"
        [hasText]="!!testText"
      />
    </div>
  `,
  styleUrls: ['./test-tab.component.scss'],
})
export class TestTabComponent implements OnChanges {
  @Input() incomingPreset: RegexPreset | null = null;

  pattern = '';
  flags = 'g';
  testText = '';
  segments: MatchResult[] = [];
  matchCount = 0;
  isInvalid = false;
  selectedPreset: RegexPreset | null = null;

  constructor(private regexService: RegexService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incomingPreset'] && this.incomingPreset) {
      this.onPresetSelected(this.incomingPreset);
    }
  }

  onPatternChange(p: string): void {
    this.pattern = p;
    this.selectedPreset = null;
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
    this.pattern = p.regex;
    this.flags = p.flags || 'g';
    this.testText = p.example;
    this.update();
  }

  private update(): void {
    if (!this.pattern) {
      this.isInvalid = false;
      this.segments = [];
      this.matchCount = 0;
      return;
    }
    this.isInvalid = !this.regexService.isValid(this.pattern, this.flags);
    if (this.isInvalid) {
      this.segments = [];
      this.matchCount = 0;
      return;
    }
    this.segments = this.regexService.getMatches(this.pattern, this.flags, this.testText);
    this.matchCount = this.regexService.countMatches(this.pattern, this.flags, this.testText);
  }
}
