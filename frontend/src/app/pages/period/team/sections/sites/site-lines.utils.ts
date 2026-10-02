import { percent } from '@core/format/format.utils';
import { PlantNumbersRow, SiteRow, TempoRow } from '@core/periods/team.model';
import { GapLine } from '@shared/gap-list/gap-list.model';

/** Each site's post-plants (attack): how often the squad plants there, then how those rounds end. */
export function postPlantLines(rows: SiteRow[]): GapLine[] {
  return rows.map((row) => ({
    label: `${row.mapName} ${row.site}`,
    detail:
      `${percent(row.plantShare)} de vos plants` +
      (row.topPlantShare ? `, top ranked ${percent(row.topPlantShare)}` : ''),
    squad: row.postPlant.squad,
    reference: row.postPlant.reference,
  }));
}

/** Each site's retakes (defense): how often the opponents plant there, then how many come back. */
export function retakeLines(rows: SiteRow[]): GapLine[] {
  return rows.map((row) => ({
    label: `${row.mapName} ${row.site}`,
    detail: `${percent(row.plantsAgainstShare)} des plants adverses`,
    squad: row.retake.squad,
    reference: row.retake.reference,
  }));
}

/** Post-plants by when the spike went down, with how often the squad plants at that time. */
export function tempoLines(rows: TempoRow[]): GapLine[] {
  return rows.map((row) => ({
    label: `Plant ${row.label.charAt(0).toLowerCase()}${row.label.slice(1)}`,
    detail: `${percent(row.share)} de vos plants, top ranked ${percent(row.topShare)}`,
    squad: row.won,
    reference: row.topWon,
  }));
}

/** Post-plants (attack) or retakes (defense) by players alive on each side when the spike went down. */
export function numbersLines(rows: PlantNumbersRow[], side: 'attack' | 'defense'): GapLine[] {
  return rows.map((row) => ({
    label: row.label,
    squad: side === 'attack' ? row.postPlant : row.retake,
    reference: side === 'attack' ? row.topPostPlant : row.topRetake,
  }));
}
