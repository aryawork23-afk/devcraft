export type DateExtractionResult = {
  dueDate: string | null
  deadlineMentioned: boolean
}

const weekdayNumbers: Record<string, number> = {
  sunday: 0,
  ravivar: 0,
  ravivaar: 0,
  monday: 1,
  somvar: 1,
  somvaar: 1,
  tuesday: 2,
  mangalvar: 2,
  mangalvaar: 2,
  wednesday: 3,
  budhvar: 3,
  budhvaar: 3,
  thursday: 4,
  guruvar: 4,
  guruvaar: 4,
  friday: 5,
  shukravar: 5,
  shukravaar: 5,
  saturday: 6,
  shanivar: 6,
  shanivaar: 6,
}

const monthNumbers: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
}

const vagueDeadlinePhrases = [
  'jaldi',
  'asap',
  'urgent',
  'jab ho jaye',
  'festival se pehle',
  'next week kabhi bhi',
  'agle hafte kabhi bhi',
  'agle mahine',
  'mahine ke end tak',
  'diwali se pehle',
  'shaadi se pehle',
  'exam ke baad',
  'jab time mile',
]

function parseAnchorDate(receivedAt: string): Date {
  const match = receivedAt.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (!match) {
    throw new Error('received_at must begin with YYYY-MM-DD')
  }

  return new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    ),
  )
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number): string {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return formatDate(result)
}

function strictlyNextWeekday(
  anchor: Date,
  targetWeekday: number,
): string {
  const currentWeekday = anchor.getUTCDay()
  let daysAhead = (targetWeekday - currentWeekday + 7) % 7

  if (daysAhead === 0) {
    daysAhead = 7
  }

  return addDays(anchor, daysAhead)
}

function upcomingSaturday(anchor: Date): string {
  const currentWeekday = anchor.getUTCDay()
  const daysAhead = (6 - currentWeekday + 7) % 7

  return addDays(anchor, daysAhead)
}

function resolveDayOfMonth(
  anchor: Date,
  requestedDay: number,
): string | null {
  if (requestedDay < 1 || requestedDay > 31) {
    return null
  }

  let year = anchor.getUTCFullYear()
  let month = anchor.getUTCMonth()

  if (requestedDay < anchor.getUTCDate()) {
    month += 1

    if (month > 11) {
      month = 0
      year += 1
    }
  }

  const result = new Date(Date.UTC(year, month, requestedDay))

  if (result.getUTCDate() !== requestedDay) {
    return null
  }

  return formatDate(result)
}

function resolveNamedMonthDate(
  anchor: Date,
  day: number,
  month: number,
): string | null {
  let year = anchor.getUTCFullYear()
  let result = new Date(Date.UTC(year, month - 1, day))

  if (
    result.getUTCDate() !== day ||
    result.getUTCMonth() !== month - 1
  ) {
    return null
  }

  if (result < anchor) {
    year += 1
    result = new Date(Date.UTC(year, month - 1, day))
  }

  return formatDate(result)
}

export function extractDueDate(
  normalizedMessage: string,
  receivedAt: string,
): DateExtractionResult {
  const text = normalizedMessage.toLowerCase()
  const anchor = parseAnchorDate(receivedAt)

  if (/\baaj\b/.test(text)) {
    return {
      dueDate: formatDate(anchor),
      deadlineMentioned: true,
    }
  }

  if (/\b(?:narsu|tarso)\b/.test(text)) {
    return {
      dueDate: addDays(anchor, 3),
      deadlineMentioned: true,
    }
  }

  if (/\bparso\b/.test(text)) {
    return {
      dueDate: addDays(anchor, 2),
      deadlineMentioned: true,
    }
  }

  if (/\bkal\b/.test(text)) {
    return {
      dueDate: addDays(anchor, 1),
      deadlineMentioned: true,
    }
  }

  if (
    text.includes('is weekend') ||
    text.includes('this weekend')
  ) {
    return {
      dueDate: upcomingSaturday(anchor),
      deadlineMentioned: true,
    }
  }

  const weekdayPattern = Object.keys(weekdayNumbers).join('|')
  const weekdayMatches = [
    ...text.matchAll(
      new RegExp(
        `(?:agle|next)\\s+(${weekdayPattern})`,
        'g',
      ),
    ),
  ]

  if (weekdayMatches.length > 0) {
    const selectedMatch =
      weekdayMatches.find((match) => {
        const nearbyText = text.slice(
          match.index,
          match.index + match[0].length + 12,
        )

        return !nearbyText.includes('nahi')
      }) ?? weekdayMatches[weekdayMatches.length - 1]

    return {
      dueDate: strictlyNextWeekday(
        anchor,
        weekdayNumbers[selectedMatch[1]],
      ),
      deadlineMentioned: true,
    }
  }

  const dayCountMatch = text.match(
    /(\d+)\s*din\s*(?:me|mein|tak)\b/,
  )

  if (dayCountMatch) {
    return {
      dueDate: addDays(anchor, Number(dayCountMatch[1])),
      deadlineMentioned: true,
    }
  }

  if (
    text.includes('agle hafte') ||
    text.includes('next week')
  ) {
    if (
      text.includes('kabhi bhi') ||
      text.includes('anytime')
    ) {
      return {
        dueDate: null,
        deadlineMentioned: true,
      }
    }

    return {
      dueDate: addDays(anchor, 7),
      deadlineMentioned: true,
    }
  }

  const dayOfMonthMatch = text.match(
    /\b(\d{1,2})\s*(?:tarikh|tareekh|तारीख|ko|को)\b/,
  )

  if (dayOfMonthMatch) {
    return {
      dueDate: resolveDayOfMonth(
        anchor,
        Number(dayOfMonthMatch[1]),
      ),
      deadlineMentioned: true,
    }
  }

  const monthPattern = Object.keys(monthNumbers).join('|')
  const namedMonthMatch = text.match(
    new RegExp(`\\b(\\d{1,2})\\s+(${monthPattern})\\b`),
  )

  if (namedMonthMatch) {
    return {
      dueDate: resolveNamedMonthDate(
        anchor,
        Number(namedMonthMatch[1]),
        monthNumbers[namedMonthMatch[2]],
      ),
      deadlineMentioned: true,
    }
  }

  const numericDateMatch = text.match(
    /\b(\d{1,2})\/(\d{1,2})\b/,
  )

  if (numericDateMatch) {
    return {
      dueDate: resolveNamedMonthDate(
        anchor,
        Number(numericDateMatch[1]),
        Number(numericDateMatch[2]),
      ),
      deadlineMentioned: true,
    }
  }

  const vagueDeadlineFound = vagueDeadlinePhrases.some(
    (phrase) => text.includes(phrase),
  )

  return {
    dueDate: null,
    deadlineMentioned: vagueDeadlineFound,
  }
}