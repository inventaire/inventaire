module.exports =
  getSimpleDayDate: (date)->
    # Parse ISO date
    date?.split('T')[0]
    # If the date is a January 1st, it's very probably because
    # its a year-precision date
    .replace '-01-01', ''

  sortByDate: (a, b)-> formatDate(a) - formatDate(b)

formatDate = (obj)->
  { date, ordinal } = obj
  if date? then new Date(date).getTime()
  else fakeLastYearTime ordinal

# If no date is available, make it appear last by providing a date in the future
# Add the ordinal so that items without a date are still prioritized by ordinal
# lastYearBase to update once we will have passed the year 2100
lastYearBase = 2100
fakeLastYearTime = (ordinal)->
  fakeDateYearString = (lastYearBase + ordinalNum ordinal).toString()
  return new Date(fakeDateYearString).getTime()

lastOrdinal = 1000
ordinalNum = (ordinal)->
  if /^\d+$/.test ordinal then parseInt ordinal
  else lastOrdinal
