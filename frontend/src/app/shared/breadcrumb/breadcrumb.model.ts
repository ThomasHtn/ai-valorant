/** One step of a breadcrumb; the last step is the page itself, a step without link is plain text. */
export interface Crumb {
  label: string;
  /** Router link of the step; null for the current page or a step that only names a group. */
  link: string[] | null;
  /** Query parameters of the link; the period is always kept on top of them. */
  queryParams?: Record<string, string>;
}
