import { ReportOrigin } from './report-origin.model';
import { REPORT_VIEWS } from './report-views.constants';

/** Report path prefix; anything else (home, glossary) is not a report origin. */
const REPORT_PREFIX = '/report/';

/** Origin of a report URL, labelled by its view; null outside the report or for an unknown view. */
export function reportOrigin(url: string): ReportOrigin | null {
  if (!url.startsWith(REPORT_PREFIX)) {
    return null;
  }
  const [path, id] = url.slice(REPORT_PREFIX.length).split(/[?#]/)[0].split('/');
  if (path === 'matches' && id) {
    return { url, label: 'Retour au match' };
  }
  const view = REPORT_VIEWS.find((v) => v.path === path);
  return view ? { url, label: `Retour à ${view.label}` } : null;
}

/** True for a URL of the Rounds view, which never counts as its own origin. */
export function isRoundsUrl(url: string): boolean {
  return url.split(/[?#]/)[0].split('/')[2] === 'rounds';
}
