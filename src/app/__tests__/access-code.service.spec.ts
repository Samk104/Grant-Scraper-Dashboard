import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AccessCodeService } from '../services/access-code.service';

describe('AccessCodeService', () => {
  let svc: AccessCodeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [AccessCodeService] });
    svc = TestBed.inject(AccessCodeService);
  });

  it('initializes from localStorage and updates localStorage on set()', () => {
    expect(svc.code()).toBeNull();

    svc.set('  admin123  ');
    expect(svc.code()).toBe('admin123');
    expect(localStorage.getItem('access_code')).toBe('admin123');

    svc.set(''); // clears
    expect(svc.code()).toBeNull();
    expect(localStorage.getItem('access_code')).toBeNull();
  });

  it('openModal/closeModal toggles modalOpen signal', () => {
    expect(svc.modalOpen()).toBeFalse();
    svc.openModal();
    expect(svc.modalOpen()).toBeTrue();
    svc.closeModal();
    expect(svc.modalOpen()).toBeFalse();
  });

  it('waitForCode resolves immediately if code already set', async () => {
    svc.set('x');
    const result = await svc.waitForCode();
    expect(result).toBe('x');
  });

  it('waitForCode waits until code is set, then closes modal', fakeAsync(() => {
    let resolved: string | null = null;
    void svc.waitForCode().then((v) => (resolved = v));
    expect(svc.modalOpen()).toBeTrue();
    svc.set('abc123');
    tick(200);
    expect(resolved!).toBe('abc123');
    expect(svc.modalOpen()).toBeFalse();
  }));
});
