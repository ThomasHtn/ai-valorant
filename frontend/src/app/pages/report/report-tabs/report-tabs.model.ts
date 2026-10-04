/** Report view and sub-page read from a URL: `/report/tables/economy` is `tables` / `economy`. */
export interface ReportLocation {
  view: string | null;
  sub: string | null;
}
