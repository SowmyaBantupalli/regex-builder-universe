import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RegexPreset } from '../../models/preset.model';
import { PresetService } from '../../services/preset.service';

@Component({
  selector: 'app-preset-dropdown',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dropdown-wrapper" [class.open]="isOpen">
      <button class="dropdown-trigger" type="button" (click)="toggle()">
        <span class="trigger-copy">
          <span class="trigger-label">{{ selectedPreset?.name ?? 'Search Regex Presets…' }}</span>
          <span class="trigger-subtitle">{{ selectedPreset?.description ?? 'Type to filter by name, category, or description' }}</span>
        </span>
        <span class="chevron" [class.flipped]="isOpen">▾</span>
      </button>

      <div class="dropdown-panel" *ngIf="isOpen">
        <div class="search-box">
          <input
            [formControl]="searchControl"
            class="search-input"
            placeholder="Filter presets…"
            autocomplete="off"
            #searchInput
          />
        </div>
        <ul class="preset-list" *ngIf="filtered.length > 0; else noResults">
          <li
            *ngFor="let p of filtered"
            class="preset-item"
            [class.active]="p.id === selectedPreset?.id"
            (click)="select(p)"
          >
            <div class="preset-name">{{ p.name }}</div>
            <div class="preset-desc">{{ p.description }}</div>
            <div class="preset-meta">
              <span class="preset-category">{{ p.category }}</span>
              <span class="preset-regex">{{ '/' + p.regex.slice(0, 28) + (p.regex.length > 28 ? '…' : '') + '/' + p.flags }}</span>
            </div>
          </li>
        </ul>
        <ng-template #noResults>
          <p class="no-results">No presets match "{{ searchControl.value }}"</p>
        </ng-template>
      </div>
    </div>
  `,
  styleUrls: ['./preset-dropdown.component.scss'],
})
export class PresetDropdownComponent implements OnInit {
  @Input() selectedPreset: RegexPreset | null = null;
  @Output() presetSelected = new EventEmitter<RegexPreset>();

  isOpen = false;
  searchControl = new FormControl('');
  filtered: RegexPreset[] = [];
  all: RegexPreset[] = [];

  constructor(private presetService: PresetService, private elRef: ElementRef) {}

  ngOnInit(): void {
    this.all = this.presetService.getAll();
    this.filtered = this.all;
    this.searchControl.valueChanges.subscribe((q) => {
      this.filtered = q ? this.presetService.search(q) : this.all;
    });
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchControl.setValue('');
      this.filtered = this.all;
      setTimeout(() => {
        this.elRef.nativeElement.querySelector('.search-input')?.focus();
      }, 50);
    }
  }

  select(p: RegexPreset): void {
    this.presetSelected.emit(p);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.isOpen = false;
    }
  }
}
