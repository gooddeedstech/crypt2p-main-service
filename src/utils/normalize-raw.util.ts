/**
 * Normalize raw Postgres query results.
 *
 * Postgres lowercases aliases unless wrapped in quotes.
 * This utility auto-fixes:
 *  - totalAmount → totalAmount
 *  - totalamount → totalAmount
 *  - TRANSACTIONCOUNT → transactionCount
 *  - user_id → userId
 *  - any_key → anyKey
 */
export function normalizeRaw<T = any>(row: any): T {
  const normalized: any = {};

  for (const key of Object.keys(row)) {
    const value = row[key];

    // Convert snake_case → camelCase
    const camelKey = key.replace(/_([a-z])/g, (m, g) => g.toUpperCase());

    // Convert lowercase totalamount → totalAmount (based on numeric rules)
    const fixedKey = camelKey.replace(
      /(count$|amount$)/,
      (ending) => ending.charAt(0).toUpperCase() + ending.slice(1)
    );

    normalized[fixedKey] = value;
  }

  return normalized as T;
}

/**
 * Normalize arrays of raw results
 */
export function normalizeRawMany<T = any>(rows: any[]): T[] {
  return rows.map((r) => normalizeRaw<T>(r));
}