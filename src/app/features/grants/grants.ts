import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GrantsService, ListParams } from '../../services/grants.service';
import { GrantDetail, FeedbackPayload, FeedbackDryRun, ListResponse } from '../../types/grants';

type Reviewed = 'reviewed' | 'unreviewed' | '';
type Rel = 'relevant' | 'not_relevant' | '';
type Fb = 'has_feedback' | 'no_feedback' | '';

type CorrStringKey = 'url' | 'grant_amount' | 'tags' | 'deadline' | 'email';
type CorrBoolKey = 'is_relevant';

type UiCorrections = Partial<Record<CorrStringKey, string> & Record<CorrBoolKey, boolean>>;

interface FormState {
  rationale?: string;
  corrections?: UiCorrections;
}

@Component({
  standalone: true,
  selector: 'app-grants',
  imports: [CommonModule, FormsModule],
  templateUrl: './grants.html',
  styleUrls: ['./grants.scss'],
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class GrantsComponent implements OnInit {
  private api = inject(GrantsService);

  onKeydown(ev: KeyboardEvent) {
    const key = this.expandedKey();
    if (!key) return;
    const g = this.items().find((x) => x.unique_key === key);
    if (!g) return;

    if (ev.key === 'ArrowRight') {
      this.decide(g, true);
      ev.preventDefault();
    } else if (ev.key === 'ArrowLeft') {
      this.decide(g, false);
      ev.preventDefault();
    } else if (ev.key === 'ArrowUp') {
      this.toggleExpand(g);
      ev.preventDefault();
    }
  }

  q = signal('');
  reviewed = signal<Reviewed>('unreviewed');
  relevance = signal<Rel>('relevant');
  relevanceLocked = signal(true);
  feedback = signal<Fb>('');
  source = signal('');
  minAmount = signal<number | null>(null);

  page = signal(1);
  perPage = 25;

  total = signal(0);
  items = signal<GrantDetail[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  expandedKey = signal<string | null>(null);
  dryRun = signal<{ unique_key: string; diff: any } | null>(null);

  formErrors = signal<Record<string, string | null>>({});

  filtersApplied = signal(false);
  private filterToastTimer: ReturnType<typeof setTimeout> | null = null;

  params = computed<ListParams>(() => ({
    q: this.q() || undefined,
    reviewed: this.reviewed() || undefined,
    relevance: this.relevanceLocked() ? 'relevant' : this.relevance() || undefined,
    feedback: this.feedback() || undefined,
    source: this.source() || undefined,
    min_amount: this.minAmount() ?? undefined,
    page: this.page(),
    per_page: this.perPage,
  }));

  ngOnInit() {
    this.fetch();
  }

  fetch(showAppliedToast = false) {
    this.loading.set(true);
    this.error.set(null);
    this.api.list(this.params()).subscribe({
      next: (res: ListResponse) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.expandedKey.set(res.items[0]?.unique_key ?? null);
        if (showAppliedToast) {
          queueMicrotask(() => this.showFiltersAppliedToast());
        }
      },
      error: (e: unknown) => this.error.set(this.pretty(e)),
      complete: () => this.loading.set(false),
    });
  }

  applyFilters() {
    this.page.set(1);
    this.fetch(true);
  }

  prev() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.fetch();
    }
  }
  next() {
    if (this.page() * this.perPage < this.total()) {
      this.page.update((p) => p + 1);
      this.fetch();
    }
  }

  onMinAmountChange(v: any) {
    if (v === '' || v === null || v === undefined) {
      this.minAmount.set(null);
      return;
    }
    const n = +v;
    this.minAmount.set(Number.isFinite(n) && n >= 0 ? n : null);
  }
  priorityScore(info: any): number | null {
    const raw = info?.priority_score;
    const n = typeof raw === 'number' ? raw : +(typeof raw === 'string' ? raw : NaN);
    return Number.isFinite(n) ? n : null;
  }
  isHighPriority(info: any): boolean {
    const n = this.priorityScore(info);
    return n !== null && n > 50;
  }
  isLowPriority(info: any): boolean {
    const n = this.priorityScore(info);
    return n !== null && n <= 50;
  }

  forms = signal<Record<string, FormState>>({});

  getRationale(key: string): string {
    return (this.forms()[key]?.rationale ?? '') as string;
  }
  setRationale(key: string, value: string) {
    this.forms.update((map) => {
      const prev = map[key] ?? {};
      return { ...map, [key]: { ...prev, rationale: value } };
    });
  }

  getCorrectionString(key: string, name: CorrStringKey): string {
    const v = this.forms()[key]?.corrections?.[name];
    return typeof v === 'string' ? v : '';
  }
  setCorrectionString(key: string, name: CorrStringKey, value: string) {
    this.forms.update((map) => {
      const prev = map[key] ?? {};
      const corr = prev.corrections ?? {};
      return { ...map, [key]: { ...prev, corrections: { ...corr, [name]: value } } };
    });
  }
  getCorrectionBoolean(key: string, name: CorrBoolKey): boolean {
    const v = this.forms()[key]?.corrections?.[name];
    return typeof v === 'boolean' ? v : false;
  }
  setCorrectionBoolean(key: string, name: CorrBoolKey, value: boolean) {
    this.formErrors.update((m) => ({ ...m, [key]: null }));
    this.forms.update((map) => {
      const prev = map[key] ?? {};
      const corr = prev.corrections ?? {};
      return { ...map, [key]: { ...prev, corrections: { ...corr, [name]: value } } };
    });
  }

  private populateFormFromGrant(g: GrantDetail) {
    const existing = this.forms()[g.unique_key];
    if (existing) return;
    const corrections: UiCorrections = {
      url: g.url ?? '',
      email: g.email ?? '',
      grant_amount: g.grant_amount ?? '',
      deadline: g.deadline ?? '',
      tags: g.tags ?? '',
    };
    this.forms.update((m) => ({ ...m, [g.unique_key]: { rationale: '', corrections } }));
    this.formErrors.update((m) => ({ ...m, [g.unique_key]: null }));
  }

  private normalizeCorrections(ui?: UiCorrections): FeedbackPayload['corrections'] | undefined {
    if (!ui) return undefined;

    const norm = (s: unknown): string | null | undefined => {
      if (s === undefined) return undefined;
      if (typeof s === 'string') {
        const t = s.trim();
        return t === '' ? null : t;
      }
      return undefined;
    };

    const out = {
      url: norm(ui.url),
      grant_amount: norm(ui.grant_amount),
      tags: norm(ui.tags),
      deadline: norm(ui.deadline),
      email: norm(ui.email),
      is_relevant: typeof ui.is_relevant === 'boolean' ? ui.is_relevant : undefined,
    };

    const anyDefined = Object.values(out).some((v) => v !== undefined);
    return anyDefined ? out : undefined;
  }

  toggleExpand(g: GrantDetail) {
    const isNow = this.expandedKey() === g.unique_key ? null : g.unique_key;
    if (isNow) this.populateFormFromGrant(g);
    this.expandedKey.set(isNow);
    if (isNow && !g.is_viewed) {
      this.api.get(g.unique_key, true).subscribe({
        next: (fresh: GrantDetail) => {
          this.items.update((arr) => arr.map((x) => (x.unique_key === g.unique_key ? fresh : x)));
        },
        error: (_e: unknown) => {},
      });
    }
  }

  decide(g: GrantDetail, relevant: boolean) {
    const before = structuredClone(g);

    this.items.update((arr) =>
      arr.map((x) => {
        if (x.unique_key !== g.unique_key) return x;
        const nx = { ...x };
        nx.user_feedback = true;
        nx.user_feedback_info = { ...(x.user_feedback_info || {}), user_is_relevant: relevant };
        return nx;
      })
    );

    const f = this.forms()[g.unique_key] ?? {};
    const payload: FeedbackPayload = {
      user_is_relevant: relevant,
      rationale: (f.rationale ?? '').trim() || undefined,
      corrections: this.normalizeCorrections(f.corrections),
    };

    this.api.submitFeedback(g.unique_key, payload).subscribe({
      next: (res: GrantDetail | FeedbackDryRun) => {
        if ((res as any).dry_run) {
          const diff = (res as FeedbackDryRun).would_change;
          this.dryRun.set({ unique_key: g.unique_key, diff });
          this.items.update((arr) => arr.map((x) => (x.unique_key === g.unique_key ? before : x)));
          return;
        }
        this.removeCard(g.unique_key);
      },
      error: (e: unknown) => {
        this.items.update((arr) => arr.map((x) => (x.unique_key === g.unique_key ? before : x)));
        this.formErrors.update((m) => ({ ...m, [g.unique_key]: this.pretty(e) }));
      },
    });
  }

  submitForm(g: GrantDetail) {
    const f = this.forms()[g.unique_key] ?? {};
    const isRel = f.corrections?.is_relevant;
    if (typeof isRel !== 'boolean') {
      this.formErrors.update((m) => ({
        ...m,
        [g.unique_key]: 'Please choose “Relevant?” before submitting.',
      }));
      return;
    }
    const payload: FeedbackPayload = {
      user_is_relevant: isRel,
      rationale: (f.rationale ?? '').trim() || undefined,
      corrections: this.normalizeCorrections(f.corrections),
    };

    this.api.submitFeedback(g.unique_key, payload).subscribe({
      next: (res: GrantDetail | FeedbackDryRun) => {
        if ((res as any).dry_run) {
          const diff = (res as FeedbackDryRun).would_change;
          this.dryRun.set({ unique_key: g.unique_key, diff });
          return;
        }
        this.removeCard(g.unique_key);
      },
      error: (e: unknown) => {
        this.formErrors.update((m) => ({ ...m, [g.unique_key]: this.pretty(e) }));
      },
    });
  }

  private removeCard(unique_key: string) {
    this.items.update((arr) => arr.filter((x) => x.unique_key !== unique_key));

    const remaining = this.items().length;
    if (remaining === 0 && this.page() * this.perPage < this.total()) {
      this.next();
    }
  }

  copy(text?: string | null) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
  }

  private pretty(e: unknown): string {
    const anyE = e as any;
    if (anyE?.error?.detail)
      return typeof anyE.error.detail === 'string'
        ? anyE.error.detail
        : JSON.stringify(anyE.error.detail);
    if (anyE?.message) return anyE.message;
    try {
      return JSON.stringify(anyE?.error ?? anyE);
    } catch {
      return 'Request failed.';
    }
  }

  dragX = signal<Record<string, number>>({});

  onTouchStart(g: GrantDetail, ev: TouchEvent) {
    const x = ev.touches[0]?.clientX ?? 0;
    this.dragX.update((m) => ({ ...m, [g.unique_key + ':start']: x, [g.unique_key]: 0 }));
  }
  onTouchMove(g: GrantDetail, ev: TouchEvent) {
    const start = this.dragX()[g.unique_key + ':start'];
    if (start == null) return;
    const x = ev.touches[0]?.clientX ?? start;
    const dx = x - start;
    this.dragX.update((m) => ({ ...m, [g.unique_key]: dx }));
  }
  onTouchEnd(g: GrantDetail, _ev: TouchEvent) {
    const dx = this.dragX()[g.unique_key] ?? 0;
    const TH = 80;

    this.dragX.update((m) => {
      const { [g.unique_key]: _, [g.unique_key + ':start']: __, ...rest } = m;
      return rest;
    });

    if (dx > TH) this.decide(g, true);
    else if (dx < -TH) this.decide(g, false);
  }

  private showFiltersAppliedToast() {
    if (this.filterToastTimer) { clearTimeout(this.filterToastTimer); this.filterToastTimer = null; }
    this.filtersApplied.set(true);
    this.filterToastTimer = setTimeout(() => {
      this.filtersApplied.set(false);
      this.filterToastTimer = null;
    }, 2000);
  }
}
