import { Injectable, signal } from '@angular/core';

const KEY = 'access_code';

@Injectable({ providedIn: 'root' })
export class AccessCodeService {
  code = signal<string | null>(localStorage.getItem(KEY));
  modalOpen = signal(false);

  set(code: string) {
    const trimmed = code.trim();
    this.code.set(trimmed || null);
    if (trimmed) localStorage.setItem(KEY, trimmed);
    else localStorage.removeItem(KEY);
  }

  openModal() { this.modalOpen.set(true); }
  closeModal() { this.modalOpen.set(false); }


  waitForCode(): Promise<string> {
    if (this.code()) return Promise.resolve(this.code() as string);

    this.openModal();
    return new Promise((resolve) => {
      const iv = setInterval(() => {
        const c = this.code();
        if (c) { clearInterval(iv); this.closeModal(); resolve(c); }
      }, 150);
    });
  }
}
