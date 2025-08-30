import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpRequest } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { ExportsService, EXPORT_TYPE } from '../services/exports.service';
import { API_BASE_URL } from '../api-tokens';

describe('ExportsService', () => {
  let svc: ExportsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExportsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.example' },
      ],
    });
    svc = TestBed.inject(ExportsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('download() requests CSV with type param and returns HttpResponse<Blob>', () => {
    svc.download(EXPORT_TYPE.approved).subscribe((resp) => {
      expect(resp.ok).toBeTrue();
      expect(resp.headers.get('content-type') || '').toContain('text/csv');
      expect(resp.body instanceof Blob).toBeTrue();
    });

    const req = http.expectOne((r: HttpRequest<unknown>) =>
      r.method === 'GET' &&
      r.url === 'http://api.example/api/exports/grants.csv' &&
      r.params.get('type') === 'approved'
    );

    const blob = new Blob(['id,title\n1,Grant'], { type: 'text/csv' });
    req.flush(blob, {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/csv' },
    });
  });
});
