import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from '../api-tokens';
import { Observable } from 'rxjs';
import { ListResponse, GrantDetail, FeedbackPayload, FeedbackDryRun } from '../types/grants';

export type ListParams = {
  q?: string;
  reviewed?: 'reviewed' | 'unreviewed';
  relevance?: 'relevant' | 'not_relevant';
  feedback?: 'has_feedback' | 'no_feedback';
  source?: string;
  min_amount?: number | null;
  page?: number;
  per_page?: number;
};

@Injectable({ providedIn: 'root' })
export class GrantsService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  list(params: ListParams): Observable<ListResponse> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      p = p.set(k, String(v));
    });
    return this.http.get<ListResponse>(`${this.base}/api/grants`, { params: p });
  }

  get(uniqueKey: string, mark_viewed = true): Observable<GrantDetail> {
    const params = new HttpParams().set('mark_viewed', String(mark_viewed));
    return this.http.get<GrantDetail>(`${this.base}/api/grants/${uniqueKey}`, { params });
  }

  submitFeedback(uniqueKey: string, payload: FeedbackPayload): Observable<GrantDetail | FeedbackDryRun> {
    return this.http.post<GrantDetail | FeedbackDryRun>(`${this.base}/api/grants/${uniqueKey}/feedback`, payload);
  }
}
