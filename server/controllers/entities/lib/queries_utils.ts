import { isPositiveIntegerString } from '#lib/boolean_validations'

export function getSimpleDayDate (date: string) {
  if (date) {
    // Parse ISO date
    return date.split('T')[0]
    // If the date is a January 1st, it's very probably because
    // its a year-precision date
    .replace('-01-01', '')
  }
}

export const sortByOrdinalOrDate = (a, b) => getPartScore(a) - getPartScore(b)
export const sortByScore = (a, b) => b.score - a.score

const earliestDate = -10e10
function getPartScore (obj) {
  const { date, ordinal, subparts } = obj
  // Push parts with subparts up if they don't have a date or ordinal of their own
  if ((subparts > 0) && (date == null) && (ordinal == null)) return earliestDate - subparts
  // Fake a very early date to be ranked before any entity
  // with a date but no ordinal
  if (ordinal != null) return earliestDate + ordinalNum(ordinal)
  if (date != null) return new Date(date).getTime()
  return lastYearTime
}

// If no date is available, make it appear last by providing a date in the future
// Update once we passed the year 2100
const lastYearTime = new Date('2100').getTime()

const lastOrdinal = 1000
function ordinalNum (ordinal) {
  if (isPositiveIntegerString(ordinal)) {
    return parseInt(ordinal)
  } else {
    // Allows to sort ordinals that combine letters and numbers
    // ex: HS1 should come before HS2, but after numbers-only ordinals
    return lastOrdinal + getStringNumericRepresentation(ordinal)
  }
}

function getStringNumericRepresentation (ordinal) {
  return parseInt(Buffer.from(ordinal).toString('hex'), 16)
}
