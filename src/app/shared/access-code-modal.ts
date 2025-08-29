import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';            // for [(ngModel)]
import { AccessCodeService } from '../services/access-code.service';

@Component({
  standalone: true,
  selector: 'app-access-code-modal',
  imports: [CommonModule, FormsModule],
  template: `
  @if (svc.modalOpen()) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="mb-2 text-xl font-semibold">Enter Access Code</h2>
        <p class="mb-4 text-sm text-slate-600">Access code required to continue</p>

        <input
          [(ngModel)]="value"
          placeholder="Paste code"
          class="w-full rounded-xl border p-3 focus:outline-none focus:ring"
          (keyup.enter)="save()" />

        <div class="mt-4 flex gap-2 justify-end">
          <button class="rounded-xl px-4 py-2" (click)="cancel()">Cancel</button>
          <button class="rounded-xl bg-slate-900 text-white px-4 py-2" (click)="save()">Save</button>
        </div>
      </div>
    </div>
  }
  `
})
export class AccessCodeModalComponent {
  svc = inject(AccessCodeService);
  value = '';

  save() {
    const v = this.value.trim();
    if (v) this.svc.set(v);
  }

  cancel() {
    this.value = '';
    this.svc.closeModal();
  }
}
