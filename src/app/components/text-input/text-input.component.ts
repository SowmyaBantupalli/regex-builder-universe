import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="text-input-wrapper">
      <div class="field-meta">
        <label class="field-label">Test Text</label>
        <span class="field-hint">Paste one or more lines to see live matches</span>
      </div>
      <textarea
        [formControl]="control"
        class="text-area"
        [placeholder]="placeholder"
        rows="7"
        spellcheck="false"
      ></textarea>
    </div>
  `,
  styleUrls: ['./text-input.component.scss'],
})
export class TextInputComponent {
  @Input() placeholder = 'Paste or type text to test against…';
  @Input() set externalValue(v: string) {
    if (this.control.value !== v) this.control.setValue(v, { emitEvent: false });
  }
  @Output() textChange = new EventEmitter<string>();

  control = new FormControl('');

  constructor() {
    this.control.valueChanges.pipe(debounceTime(200), distinctUntilChanged()).subscribe((v) =>
      this.textChange.emit(v ?? '')
    );
  }
}
