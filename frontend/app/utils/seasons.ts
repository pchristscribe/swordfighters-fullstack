// Seasonal recommendations
//
// Products carry free-form `tags` (see migration 001). We reserve a small
// set of well-known tags for seasonal programming so the home page and
// /seasonal/[season] can surface "right now" picks without a schema change.

export interface Season {
  slug: string
  label: string
  tag: string
  blurb: string
  // Northern-hemisphere month ranges (1-indexed, inclusive). `spring` = Mar-May, etc.
  months: number[]
}

export const SEASONS: Record<string, Season> = {
  spring: {
    slug: 'spring',
    label: 'Spring',
    tag: 'spring',
    blurb: 'Light layers, bright colors, and outdoor-ready picks.',
    months: [3, 4, 5],
  },
  summer: {
    slug: 'summer',
    label: 'Summer',
    tag: 'summer',
    blurb: 'Beach days, pool parties, and warm-weather essentials.',
    months: [6, 7, 8],
  },
  pride: {
    slug: 'pride',
    label: 'Pride',
    tag: 'pride',
    blurb: 'Celebrate loud. Curated gear for Pride Month and beyond.',
    months: [6],
  },
  fall: {
    slug: 'fall',
    label: 'Fall',
    tag: 'fall',
    blurb: 'Cozy layers, moody colors, and autumn staples.',
    months: [9, 10, 11],
  },
  holiday: {
    slug: 'holiday',
    label: 'Holiday',
    tag: 'holiday',
    blurb: 'Gift-ready picks for the season of giving.',
    months: [11, 12],
  },
  winter: {
    slug: 'winter',
    label: 'Winter',
    tag: 'winter',
    blurb: 'Stay warm. Cold-weather essentials and cold-night indulgences.',
    months: [12, 1, 2],
  },
}

export const SEASON_LIST: Season[] = Object.values(SEASONS)

// Returns the most relevant season for "today". Pride is preferred during
// June so it overrides the generic summer slot.
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1 // 1-12
  if (month === 6) return SEASONS.pride!
  if (month === 11 || month === 12) return SEASONS.holiday!
  const match = SEASON_LIST.find((s) => s.months.includes(month))
  return match ?? SEASONS.summer!
}

export function getSeason(slug: string): Season | undefined {
  return SEASONS[slug]
}
