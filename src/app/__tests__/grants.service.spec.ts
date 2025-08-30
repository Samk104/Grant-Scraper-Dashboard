import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { GrantsService, ListParams } from '../services/grants.service';
import { API_BASE_URL } from '../api-tokens';

describe('GrantsService', () => {
  let svc: GrantsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GrantsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.example' },
      ],
    });
    svc = TestBed.inject(GrantsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() sends GET with only defined params', () => {
    const params: ListParams = {
      q: 'arts',
      reviewed: 'unreviewed',
      relevance: undefined,
      feedback: 'has_feedback',
      source: '',
      min_amount: 5000,
      page: 2,
      per_page: 25,
    };

    svc.list(params).subscribe((res) => expect(res).toBeTruthy());

    const req = http.expectOne(
      (r) => r.method === 'GET' && r.url === 'http://api.example/api/grants'
    );
    expect(req.request.params.get('q')).toBe('arts');
    expect(req.request.params.get('reviewed')).toBe('unreviewed');
    expect(req.request.params.get('feedback')).toBe('has_feedback');
    expect(req.request.params.has('relevance')).toBeFalse();
    expect(req.request.params.has('source')).toBeFalse();
    expect(req.request.params.get('min_amount')).toBe('5000');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('per_page')).toBe('25');

    req.flush({ items: [], total: 0 });
  });

  it('get() marks not viewed by default (mark_viewed=false)', () => {
  svc.get('uk-123').subscribe(res => {
    expect(res).toBeTruthy();
  });

  const req = http.expectOne(r =>
    r.method === 'GET' &&
    r.url === 'http://api.example/api/grants/uk-123' &&
    r.params.get('mark_viewed') === 'false'
  );
  expect(req.request.method).toBe('GET');
  req.flush({ id: 1, unique_key: 'uk-123', title: 'Grant' });
});

it('get(true) explicitly sets mark_viewed=true', () => {
  svc.get('uk-123', true).subscribe(res => {
    expect(res).toBeTruthy();
  });

  const req = http.expectOne(r =>
    r.method === 'GET' &&
    r.url === 'http://api.example/api/grants/uk-123' &&
    r.params.get('mark_viewed') === 'true'
  );
  expect(req.request.method).toBe('GET');
  req.flush({ id: 1, unique_key: 'uk-123', title: 'Grant' });
});



  it('submitFeedback() POSTs payload to /feedback', () => {
    const payload = { is_relevant: true, comments: 'Looks good' } as any;
    svc.submitFeedback('uk-1', payload).subscribe((res) => expect(res).toBeTruthy());

    const req = http.expectOne('http://api.example/api/grants/uk-1/feedback');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ ok: true, user_feedback: true });
  });
});
