// src/app/services/exports.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-tokens';


export const EXPORT_TYPE = {
  all: 'all',
  viewed: 'viewed',
  approved: 'approved',
  disapproved: 'disapproved',
  llm_not_relevant: 'llm_not_relevant',
  approved_no_email_or_no_url: 'approved_no_email_or_no_url',
} as const;

export type ExportType = typeof EXPORT_TYPE[keyof typeof EXPORT_TYPE];

@Injectable({ providedIn: 'root' })
export class ExportsService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  download(type: ExportType): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/api/exports/grants.csv`, {
      params: { type },
      observe: 'response',
      responseType: 'blob',
    });
  }
}
