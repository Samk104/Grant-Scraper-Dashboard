import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportsService, ExportType, EXPORT_TYPE  } from '../../services/exports.service';
import { HttpResponse } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-exports',
  imports: [CommonModule, FormsModule],
  templateUrl: './exports.html',
  styleUrls: ['./exports.scss'],
})
export class ExportsComponent {
ExportType = EXPORT_TYPE;


  type: ExportType = EXPORT_TYPE.all;


  loading = signal(false);
  showToastFlag = false;
  toastText = '';
  private toastTimer: any;

  tiltX = signal(0);
  tiltY = signal(0);
  isHovering = signal(false);

  showDidYouKnow = false;

  readonly didYouKnowPrompt = `
You just downloaded a CSV of grant opportunities that were APPROVED by our team but are missing a URL and/or an email contact.
Please help fill in the missing fields using cautious web searches.

WHAT TO DO
1) Ingest the attached CSV. Each row has: id, title, url, source, scraped_at, is_relevant, grant_amount, deadline, tags, user_feedback, user_feedback_info, email.
2) For rows where url is blank/"Not Available" or email is blank/"Not Available":
   • Search for the official grant/opportunity page (prefer the publisher's own site over 3rd parties).
   • If multiple candidates exist, pick the one most consistent with title/source/tags; otherwise mark as "ambiguous".
   • For email: prefer a dedicated grants/applications contact; if only generic "info@" exists, use it and note it as generic.
   • Avoid scraping personal emails from PDFs unless clearly intended for public inquiries.
3) Output a CLEAN CSV (same order and number of rows as input) with these columns:
   id,title,url,source,scraped_at,is_relevant,grant_amount,deadline,tags,user_feedback,user_feedback_info,email,
   and two extra columns at the end:
   found_url,found_email
   • found_url/found_email should be your proposed values (may be blank if truly unknown), NOT overwriting url/email.
4) Add a final column "confidence" with values: high | medium | low, based on how certain you are.
5) If a row remains unresolved, add a short reason in a "notes" column (e.g., "multiple orgs share name", "event page removed").

GUARDRAILS
• Prioritize official sources; cite them in notes when confidence != high.
• Do NOT invent addresses; avoid data broker sites and scraped personal directories.
• Preserve original row order; ensure CSV is UTF-8 and quotes fields if needed.

DELIVERABLE
Return only a downloadable CSV with the added columns: found_url,found_email,confidence,notes.
  `.trim();

  constructor(private api: ExportsService) {}

  private showToast(msg: string, ms = 2200) {
    this.toastText = msg;
    this.showToastFlag = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.showToastFlag = false), ms);
  }

  onExport() {
    if (this.loading()) return;
    this.loading.set(true);

    this.showToast('Downloading…');

    this.api.download(this.type).subscribe({
      next: (resp: HttpResponse<Blob>) => {
        const blob = resp.body!;
        const filename = this.getFilename(resp) || `grants_${this.type}.csv`;
        this.downloadBlob(blob, filename);
        this.loading.set(false);

        if (this.type === EXPORT_TYPE.approved_no_email_or_no_url) {
          this.showDidYouKnow = true;
        }
      },
      error: (err) => {
        console.error(err);
        this.showToast('Download failed. Please try again.', 2800);
        this.loading.set(false);
      },
    });
  }

  onSelectClick() {
    this.showDidYouKnow = false;
  }

  private getFilename(resp: HttpResponse<Blob>): string | null {
    const cd = resp.headers.get('Content-Disposition');
    if (!cd) return null;
    const star = /filename\*=(?:UTF-8''|)([^;]+)/i.exec(cd);
    const plain = /filename="?([^"]+)"?/i.exec(cd);
    const raw = star?.[1] ?? plain?.[1] ?? null;
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    const card = (e.target as HTMLElement).closest('.export-card') as HTMLElement | null;
    if (!card || !this.isHovering()) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const maxRot = 6;
    this.tiltY.set(((x - midX) / midX) * maxRot);
    this.tiltX.set(-((y - midY) / midY) * maxRot);
  }
  onEnter() {
    this.isHovering.set(true);
  }
  onLeave() {
    this.isHovering.set(false);
    this.tiltX.set(0);
    this.tiltY.set(0);
  }

  async copyPrompt() {
    try {
      await navigator.clipboard.writeText(this.didYouKnowPrompt);
      this.showToast('Prompt copied!');
    } catch {
      this.showToast('Copy failed. Select and copy manually.', 2800);
    }
  }
}
