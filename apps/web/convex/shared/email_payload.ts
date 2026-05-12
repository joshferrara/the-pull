/**
 * Pass-through helper used by Convex actions to build the body of an
 * `/api/internal/send-one-email` POST. Keeping it as a function rather than a
 * plain object makes future field additions a single source change.
 */
export interface OneEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export function emailProviderPayload(p: OneEmailPayload): OneEmailPayload {
  return {
    to: p.to,
    subject: p.subject,
    html: p.html,
    text: p.text,
    headers: p.headers,
  };
}
