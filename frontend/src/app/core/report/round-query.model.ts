/**
 * Filter handed to the Rounds view when the analyst clicks a table cell: shown as a removable chip,
 * its text is searched for map and side words to pre-filter the list. Passed through the router's
 * navigation state (`history.state.roundQuery`), never through the URL.
 */
export interface RoundQuery {
  /** 'Résultats par carte · Split · Attaque'. */
  title: string;
  /** Lower case words of the clicked row (label, sub, key). */
  text: string;
}
