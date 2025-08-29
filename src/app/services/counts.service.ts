import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api-tokens';

type CountUnviewed = { unviewed: number; total: number };
type CountFeedback = { with_feedback: number; total: number };

@Injectable({ providedIn: 'root' })
export class CountsService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  getUnviewed() {
    return this.http.get<CountUnviewed>(`${this.base}/api/grants/counts/unviewed`);
  }
  getWithFeedback() {
    return this.http.get<CountFeedback>(`${this.base}/api/grants/counts/feedback`);
  }
}
