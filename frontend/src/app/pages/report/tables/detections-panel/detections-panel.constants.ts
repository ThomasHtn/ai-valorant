import { RepetitionKind } from '@core/report/detections.model';

/** Items shown per list of the panel. */
export const MAX_DETECTIONS_PER_GROUP = 6;

/** Repetitions most worth a look come first: first deaths in one spot, then causes, then situations. */
export const REPETITION_ORDER: Record<RepetitionKind, number> = {
  zone_first_deaths: 0,
  loss_cause: 1,
  situation_lost: 2,
};

/** Scope of repetitions over every map; not repeated in their title. */
export const ALL_MAPS_SCOPE = 'Toutes les cartes';
