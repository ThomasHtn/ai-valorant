/**
 * How a value is written, as the API's table columns say it (see `ValueFormat` in
 * `backend/src/valostats/schemas/report/tables.py`).
 */
export type ValueFormat = 'pct' | 'int' | 'dec1' | 'dec2' | 'sec' | 'm' | 'cr' | 'text' | 'record';
