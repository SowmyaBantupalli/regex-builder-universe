import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestTabComponent } from './pages/test-tab/test-tab.component';
import { ExplainTabComponent } from './pages/explain-tab/explain-tab.component';
import { PresetsTabComponent } from './pages/presets-tab/presets-tab.component';
import { RegexPreset } from './models/preset.model';

type Tab = 'test' | 'explain' | 'presets';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TestTabComponent, ExplainTabComponent, PresetsTabComponent],
  template: `
    <div class="app">
      <header class="app-header">
        <div class="header-inner">
          <div class="brand">
            <span class="brand-icon">/.*&#x200B;/</span>
            <div>
              <h1 class="brand-name">Regex Builder Universe</h1>
              <p class="brand-tagline">Test · Explain · Discover</p>
            </div>
          </div>
          <nav class="tab-nav">
            <button
              *ngFor="let tab of tabs"
              class="tab-btn"
              [class.active]="activeTab === tab.id"
              (click)="setTab(tab.id)"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
            </button>
          </nav>
        </div>
      </header>

      <main class="app-main">
        <div class="content-card">
          <app-test-tab
            *ngIf="activeTab === 'test'"
            [incomingPreset]="pendingPreset"
          />
          <app-explain-tab *ngIf="activeTab === 'explain'" />
          <app-presets-tab
            *ngIf="activeTab === 'presets'"
            (presetSelected)="onPresetFromLibrary($event)"
          />
        </div>
      </main>

      <footer class="app-footer">
        <span>Regex Builder Universe</span>
        <span class="footer-sep">·</span>
        <span>Built with Angular</span>
      </footer>
    </div>
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  activeTab: Tab = 'test';
  pendingPreset: RegexPreset | null = null;

  tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'test', label: 'Test', icon: '⚡' },
    { id: 'explain', label: 'Explain', icon: '📖' },
    { id: 'presets', label: 'Presets', icon: '📚' },
  ];

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  onPresetFromLibrary(p: RegexPreset): void {
    this.pendingPreset = null;
    setTimeout(() => {
      this.pendingPreset = p;
      this.activeTab = 'test';
    }, 0);
  }
}
