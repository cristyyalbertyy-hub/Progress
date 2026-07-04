import { ACCOUNT_URL } from './firebase';

const STORAGE_KEY = 'studio9_progress_return';

function isSafeReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return true;
    return (
      host.endsWith('.vercel.app') ||
      host.endsWith('studio9medicalscience.com') ||
      host.includes('medical-science')
    );
  } catch {
    return false;
  }
}

/** Persist return URL from query (set by My account when opening progress). */
export function captureReturnUrlFromQuery(): void {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('return_to');
  if (!raw || !isSafeReturnUrl(raw)) return;

  try {
    sessionStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* ignore */
  }

  params.delete('return_to');
  const rest = params.toString();
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${rest ? `?${rest}` : ''}`,
  );
}

export function getProgressReturnUrl(): string {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && isSafeReturnUrl(stored)) return stored;
  } catch {
    /* ignore */
  }
  return ACCOUNT_URL;
}
