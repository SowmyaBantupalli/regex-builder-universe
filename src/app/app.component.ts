import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestTabComponent } from './pages/test-tab/test-tab.component';
import { ExplainTabComponent } from './pages/explain-tab/explain-tab.component';
import { PresetsTabComponent } from './pages/presets-tab/presets-tab.component';
import { BuildTabComponent } from './pages/build-tab/build-tab.component';
import { RegexDraft, RegexPreset } from './models/preset.model';

type Tab = 'test' | 'explain' | 'presets' | 'build';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TestTabComponent, ExplainTabComponent, PresetsTabComponent, BuildTabComponent],
  template: `
    <div class="app">
      <header class="app-header">
        <div class="header-inner">
          <div class="brand">
            <span class="brand-icon">/\\w+/</span>
            <div class="brand-copy">
              <h1 class="brand-name">Regex Builder Universe</h1>
              <p class="brand-tagline">Minimal regex testing, explained instantly.</p>
            </div>
          </div>
          <div class="header-right">
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
            <button
              class="theme-toggle"
              type="button"
              (click)="toggleTheme()"
              [title]="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <span class="theme-icon">{{ isDark ? '☀️' : '🌙' }}</span>
              <span class="theme-label">{{ isDark ? 'Light' : 'Dark' }}</span>
            </button>
          </div>
        </div>
      </header>

      <main class="app-main">
        <section class="hero-strip">
          <div>
            <p class="hero-eyebrow">Developer Tool</p>
            <h2 class="hero-title">Test patterns, inspect matches, and learn what each token means.</h2>
          </div>
          <p class="hero-copy">
            Start with a sample, tweak the regex, and read the explanation without leaving the page.
          </p>
        </section>

        <div class="content-card">
          <app-test-tab
            *ngIf="activeTab === 'test'"
            [incomingPreset]="pendingPreset"
            [incomingDraft]="pendingDraft"
          />
          <app-explain-tab *ngIf="activeTab === 'explain'" />
          <app-presets-tab
            *ngIf="activeTab === 'presets'"
            (presetSelected)="onPresetFromLibrary($event)"
          />
          <app-build-tab
            *ngIf="activeTab === 'build'"
            (testRequested)="onDraftRequested($event)"
          />
        </div>
      </main>

      <footer class="app-footer">
        <span>Regex Builder Universe</span>
        <span class="footer-sep">·</span>
        <span>Built with Angular</span>
        <span class="footer-sep">·</span>
        <span>{{ isDark ? 'Light mode available' : 'Dark mode available' }}</span>
      </footer>
    </div>
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  activeTab: Tab = 'test';
  pendingPreset: RegexPreset | null = null;
  pendingDraft: RegexDraft | null = null;
  isDark = false;

  tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'test', label: 'Test', icon: '⚡' },
    { id: 'explain', label: 'Explain & Translate', icon: '📖' },
    { id: 'presets', label: 'Presets', icon: '📚' },
    { id: 'build', label: 'Build', icon: '⭐' },
  ];

  ngOnInit(): void {
    const saved = localStorage.getItem('theme');
    if (saved) {
      this.isDark = saved === 'dark';
    } else {
      this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('dark', this.isDark);
    document.documentElement.classList.toggle('light', !this.isDark);
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  onPresetFromLibrary(p: RegexPreset): void {
    this.pendingPreset = null;
    this.pendingDraft = null;
    setTimeout(() => {
      this.pendingPreset = p;
      this.activeTab = 'test';
    }, 0);
  }

  onDraftRequested(draft: RegexDraft): void {
    this.pendingPreset = null;
    this.pendingDraft = null;
    setTimeout(() => {
      this.pendingDraft = draft;
      this.activeTab = 'test';
    }, 0);
  }
}
