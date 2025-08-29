export interface GrantDetail {
  id: number;
  unique_key: string;
  title: string;
  url: string | null;
  description: string | null;
  grant_amount: string | null;
  tags: string | null;
  deadline: string | null;
  email: string | null;
  source: string | null;
  scraped_at: string; // ISO
  is_relevant: boolean | null;
  is_viewed: boolean;
  user_feedback: boolean | null;
  user_feedback_info: any | null;
  llm_info: any | null;
}

export interface ListResponse {
  items: GrantDetail[];
  total: number;
}

export interface FeedbackPayload {
  user_is_relevant?: boolean | null;
  rationale?: string | null;
  corrections?: Partial<{
    url: string | null;
    grant_amount: string | null;
    tags: string | null;
    deadline: string | null;
    email: string | null;
    is_relevant?: boolean | null;
  }>;
}

export interface FeedbackDryRun {
  dry_run: true;
  would_change: any;
}
