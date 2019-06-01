module.exports =
  getSimpleDayDate: (date)->
    # Parse ISO date
    date?.split('T')[0]
    # If the date is a January 1st, it's very probably because
    # its a year-precision date
    .replace '-01-01', ''

  sortByOrdinalOrDate: (a, b)-> getPartScore(a) - getPartScore(b)
  sortByScore: (a, b)-> b.score - a.score

earliestDate = -10000
getPartScore = (obj)->
  { date, ordinal, subparts } = obj
  # Push parts with subparts up if they don't have a date or ordinal of their own
  if subparts > 0 and not date? and not ordinal? then return earliestDate - subparts
  # Fake a very early date to be ranked before any entity
  # with a date but no ordinal
  if ordinal? then return earliestDate + ordinalNum(ordinal)
  if date? then return new Date(date).getTime()
  return lastYearTime

# If no date is available, make it appear last by providing a date in the future
# Update once we passed the year 2100
lastYearTime = new Date('2100').getTime()

lastOrdinal = 1000
ordinalNum = (ordinal)->
  if /^\d+$/.test ordinal then parseInt ordinal
  else lastOrdinal
