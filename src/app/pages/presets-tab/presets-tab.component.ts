import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { PresetService } from '../../services/preset.service';
import { RegexPreset } from '../../models/preset.model';

@Component({
  selector: 'app-presets-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="presets-tab">
      <div class="search-row">
        <input
          [formControl]="searchControl"
          class="search-input"
          placeholder="Search presets…"
          autocomplete="off"
        />
      </div>

      <div class="category-groups">
        <ng-container *ngFor="let cat of categories">
          <div class="category-group" *ngIf="groupedFiltered[cat]?.length">
            <p class="category-label">{{ cat }}</p>
            <div class="preset-grid">
              <div
                class="preset-card"
                *ngFor="let p of groupedFiltered[cat]"
                (click)="usePreset(p)"
                title="Click to test this pattern"
              >
                <div class="card-header">
                  <span class="card-name">{{ p.name }}</span>
                  <span class="card-category">{{ p.category }}</span>
                </div>
                <div class="card-regex">{{ '/' + p.regex + '/' + p.flags }}</div>
                <div class="card-desc">{{ p.description }}</div>
                <div class="card-example">
                  <span class="example-label">Example</span>
                  <span class="example-text">{{ p.example.slice(0, 60) }}{{ p.example.length > 60 ? '…' : '' }}</span>
                </div>
                <div class="card-cta">Try it →</div>
              </div>
            </div>
          </div>
        </ng-container>

        <div class="no-results" *ngIf="filtered.length === 0">
          No presets match "{{ searchControl.value }}"
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./presets-tab.component.scss'],
})
export class PresetsTabComponent implements OnInit {
  @Output() presetSelected = new EventEmitter<RegexPreset>();

  searchControl = new FormControl('');
  filtered: RegexPreset[] = [];
  groupedFiltered: Record<string, RegexPreset[]> = {};
  categories: string[] = [];

  constructor(private presetService: PresetService) {}

  ngOnInit(): void {
    this.filtered = this.presetService.getAll();
    this.buildGroups();

    this.searchControl.valueChanges.subscribe((q) => {
      this.filtered = q ? this.presetService.search(q) : this.presetService.getAll();
      this.buildGroups();
    });
  }

  usePreset(p: RegexPreset): void {
    this.presetSelected.emit(p);
  }

  private buildGroups(): void {
    const groups: Record<string, RegexPreset[]> = {};
    for (const p of this.filtered) {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    }
    this.groupedFiltered = groups;
    this.categories = Object.keys(groups);
  }
}
