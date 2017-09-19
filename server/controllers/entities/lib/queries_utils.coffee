module.exports =
  getSimpleDayDate: (date)->
    # Parse ISO date
    date?.split('T')[0]
    # If the date is a January 1st, it's very probably because
    # its a year-precision date
    .replace '-01-01', ''

  sortByDate: (a, b)-> formatDate(a) - formatDate(b)
  sortByOrdinalOrDate: (a, b)-> formatDate(a, true) - formatDate(b, true)

earliestDate = -10000
formatDate = (obj, preferOrdinal)->
  { date, ordinal } = obj
  # Fake a very early date to be ranked before any entity
  # with a date but no ordinal
  if preferOrdinal and ordinal? then return earliestDate + ordinalNum(ordinal)
  if date? then return new Date(date).getTime()
  return fakeLastYearTime ordinal

# If no date is available, make it appear last by providing a date in the future
# Add the ordinal so that items without a date are still prioritized by ordinal
# lastYearBase to update once we will have passed the year 2100
lastYearBase = 2100
fakeLastYearTime = (ordinal)->
  fakeDateYearString = (lastYearBase + ordinalNum(ordinal)).toString()
  return new Date(fakeDateYearString).getTime()

lastOrdinal = 1000
ordinalNum = (ordinal)->
  if /^\d+$/.test ordinal then parseInt ordinal
  else lastOrdinal
