// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = {
  getSimpleDayDate(date){
    // Parse ISO date
    return (date != null ? date.split('T')[0]
    // If the date is a January 1st, it's very probably because
    // its a year-precision date
    .replace('-01-01', '') : undefined)
  },

  sortByOrdinalOrDate(a, b){ return getPartScore(a) - getPartScore(b) },
  sortByScore(a, b){ return b.score - a.score }
}

const earliestDate = -10000
var getPartScore = function(obj){
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
var lastYearTime = new Date('2100').getTime()

const lastOrdinal = 1000
var ordinalNum = function(ordinal){
  if (/^\d+$/.test(ordinal)) { return parseInt(ordinal)
  } else { return lastOrdinal }
}
