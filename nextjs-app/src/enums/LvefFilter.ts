/** LVEF bucket filter for the studies list; values match the `lvef` query param. */
export enum LvefFilter {
  All = 'all',
  Normal = 'normal',
  Midly = 'midly',
  Severly = 'severly',
}

export function isLvefFilter(value: string): value is LvefFilter {
  return (Object.values(LvefFilter) as string[]).includes(value);
}
