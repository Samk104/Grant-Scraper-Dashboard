import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CountsService } from '../../services/counts.service';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent implements OnInit {
  private counts = inject(CountsService);

  total        = signal<number | null>(null);
  unviewed     = signal<number | null>(null);
  withFeedback = signal<number | null>(null);
  error        = signal<string | null>(null);

  ngOnInit() {
    this.counts.getUnviewed().subscribe({
      next: c => { this.unviewed.set(c.unviewed); this.total.set(c.total); },
      error: e => this.error.set(this.pretty(e))
    });
    this.counts.getWithFeedback().subscribe({
      next: c => this.withFeedback.set(c.with_feedback),
      error: e => this.error.set(this.pretty(e))
    });
  }

  private pretty(e: any): string {
    if (e?.error?.detail) return typeof e.error.detail === 'string' ? e.error.detail : JSON.stringify(e.error.detail);
    if (e?.message) return e.message;
    try { return JSON.stringify(e?.error ?? e); } catch { return 'Request failed.'; }
  }
}
