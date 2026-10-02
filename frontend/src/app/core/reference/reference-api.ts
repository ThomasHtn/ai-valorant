import { httpResource } from '@angular/common/http';
import { Service } from '@angular/core';

import { API_ENDPOINTS } from '@core/http/api-endpoints';

import { DataStatus, Glossary } from './reference.model';

/** Data-access service for reference data that never changes during a visit. */
@Service()
export class ReferenceApi {
  /** Jargon and statistic definitions; the statistic definitions also drive number formatting. */
  public readonly glossary = httpResource<Glossary>(() => API_ENDPOINTS.glossary);
  /** State of the collected data, shown at the foot of the navigation. */
  public readonly status = httpResource<DataStatus>(() => API_ENDPOINTS.status);
}
