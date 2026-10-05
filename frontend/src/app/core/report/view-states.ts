import { DOCUMENT } from '@angular/common';
import { inject, Provider, Service } from '@angular/core';

import {
  DEFAULT_PREFERENCES,
  REFERENCE_CHOICE_SCOPES,
  SCOPE_DEFAULT_REFERENCE,
} from './report-preferences.constants';
import { ReportScope } from './report-preferences.model';
import { ViewState } from './view-state';

/**
 * One `ViewState` per report view, kept for the whole session so a view finds its filters again
 * when the analyst comes back, without them leaking into the other views.
 */
@Service()
export class ViewStates {
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage ?? null;
  private readonly views = new Map<ReportScope, ViewState>();

  public get(scope: ReportScope): ViewState {
    let view = this.views.get(scope);
    if (!view) {
      const reference = SCOPE_DEFAULT_REFERENCE[scope] ?? DEFAULT_PREFERENCES.reference;
      // A fixed reference is never read back from storage, where an older choice may linger.
      const storage = REFERENCE_CHOICE_SCOPES.has(scope) ? this.storage : null;
      view = new ViewState(scope, { ...DEFAULT_PREFERENCES, reference }, storage);
      this.views.set(scope, view);
    }
    return view;
  }
}

/** Gives a view and its children (filter bar, reading bar) the view's own state. */
export function provideViewState(scope: ReportScope): Provider {
  return { provide: ViewState, useFactory: () => inject(ViewStates).get(scope) };
}
