import { httpResource, HttpResourceRef } from '@angular/common/http';
import { Service, Signal } from '@angular/core';

import { API_ENDPOINTS } from '@core/http/api-endpoints';

import { SessionListItem, SessionReport } from './session.model';

/** Data-access service for the squad's evenings. */
@Service()
export class SessionsApi {
  /** Every evening, newest first, shared by every consumer. */
  public readonly list = httpResource<SessionListItem[]>(() => API_ENDPOINTS.sessions);

  /** One evening: a `YYYY-MM-DD` day, or `latest`. */
  public report(day: Signal<string>): HttpResourceRef<SessionReport | undefined> {
    return httpResource<SessionReport>(() => API_ENDPOINTS.session(day()));
  }
}
