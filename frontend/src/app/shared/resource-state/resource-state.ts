import { Component, computed, input } from '@angular/core';
import { Resource } from '@angular/core';

import { isNotFound } from '@core/http/resource-state.utils';

/**
 * Loading / not found / error / content switch for a view backed by a resource, with ValoQuests'
 * hexagon loader. The content is projected once the resource holds a value.
 */
@Component({
  selector: 'app-resource-state',
  template: `
    @switch (state()) {
      @case ('loading') {
        <p class="flex items-center gap-3 py-8" role="status">
          <span class="loader-hex clip-hex" aria-hidden="true"></span>
          <span class="text-sm text-text-muted">Chargement…</span>
        </p>
      }
      @case ('not-found') {
        <p class="py-8 text-text-secondary">{{ notFoundText() }}</p>
      }
      @case ('error') {
        <div class="my-4 border-l-2 border-danger bg-danger/10 px-5 py-4" role="alert">
          <p class="text-text-primary">L'API ne répond pas. Vérifiez qu'elle est lancée.</p>
          <button
            type="button"
            class="focus-ring notch-tr notch-tr-edge mt-3 cursor-pointer border border-brand-500/50 bg-brand-500/12 px-4 py-2 font-display text-sm font-semibold tracking-wide text-brand-400 uppercase transition-colors hover:bg-brand-500/20 [--notch:0.5rem]"
            (click)="resource().reload()"
          >
            Réessayer
          </button>
        </div>
      }
      @default {
        <div class="resource-settle"><ng-content /></div>
      }
    }
  `,
})
export class ResourceState {
  public readonly resource = input.required<Resource<unknown> & { reload(): boolean }>();
  public readonly notFoundText = input('Aucune donnée pour cette sélection.');

  protected readonly state = computed(() => {
    const resource = this.resource();
    if (resource.hasValue()) {
      return 'content';
    }
    if (resource.error()) {
      return isNotFound(resource) ? 'not-found' : 'error';
    }
    return 'loading';
  });
}
