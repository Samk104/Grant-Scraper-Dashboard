import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { CountsService } from '../services/counts.service';
import { API_BASE_URL } from '../api-tokens';

describe('CountsService', () => {
  let svc: CountsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CountsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.example' }
      ],
    });
    svc = TestBed.inject(CountsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getUnviewed() GETs /counts/unviewed', () => {
    svc.getUnviewed().subscribe(r => {
      expect(r.unviewed).toBe(7);
      expect(r.total).toBe(10);
    });

    const req = http.expectOne('http://api.example/api/grants/counts/unviewed');
    expect(req.request.method).toBe('GET');
    req.flush({ unviewed: 7, total: 10 });
  });

  it('getWithFeedback() GETs /counts/feedback', () => {
    svc.getWithFeedback().subscribe(r => {
      expect(r.with_feedback).toBe(3);
      expect(r.total).toBe(10);
    });

    const req = http.expectOne('http://api.example/api/grants/counts/feedback');
    expect(req.request.method).toBe('GET');
    req.flush({ with_feedback: 3, total: 10 });
  });
});
