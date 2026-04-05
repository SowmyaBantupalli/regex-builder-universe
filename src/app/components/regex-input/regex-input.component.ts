import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-regex-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="regex-input-wrapper">
      <div class="regex-field" [class.invalid]="isInvalid" [class.has-value]="control.value">
        <span class="delimiter">/</span>
        <input
          [formControl]="control"
          class="regex-field__input"
          [placeholder]="placeholder"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
        />
        <span class="delimiter">/</span>
        <input
          [formControl]="flagsControl"
          class="regex-field__flags"
          placeholder="flags"
          maxlength="6"
          autocomplete="off"
          spellcheck="false"
        />
        <span class="validity-icon" *ngIf="control.value">
          <span *ngIf="!isInvalid" class="valid-icon">✓</span>
          <span *ngIf="isInvalid" class="invalid-icon">✗</span>
        </span>
      </div>
      <p class="error-msg" *ngIf="isInvalid && control.value">Invalid regex — check syntax</p>
    </div>
  `,
  styleUrls: ['./regex-input.component.scss'],
})
export class RegexInputComponent implements OnChanges {
  @Input() externalPattern = '';
  @Input() externalFlags = 'g';
  @Input() placeholder = 'Enter regex or select a preset…';
  @Input() isInvalid = false;
  @Output() patternChange = new EventEmitter<string>();
  @Output() flagsChange = new EventEmitter<string>();

  control = new FormControl('');
  flagsControl = new FormControl('g');

  constructor() {
    this.control.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe((v) =>
      this.patternChange.emit(v ?? '')
    );
    this.flagsControl.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe((v) =>
      this.flagsChange.emit(v ?? '')
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['externalPattern'] && this.control.value !== this.externalPattern) {
      this.control.setValue(this.externalPattern, { emitEvent: false });
    }
    if (changes['externalFlags'] && this.flagsControl.value !== this.externalFlags) {
      this.flagsControl.setValue(this.externalFlags, { emitEvent: false });
    }
  }
}
