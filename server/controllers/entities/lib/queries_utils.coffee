module.exports =
  getSimpleDayDate: (date)->
    # Parse ISO date
    date?.split('T')[0]
    # If the date is a January 1st, it's very probably because
    # its a year-precision date
    .replace '-01-01', ''

  sortByDate: (a, b)-> formatDate(a) - formatDate(b)

formatDate = (obj)->
  { date, rank } = obj
  if date? then new Date(date).getTime()
  else fakeLastYearTime rank

# If no date is available, make it appear last by providing a date in the future
# Add the rank so that items without a date are still prioritized by rank
# lastYearBase to update once we will have passed the year 2100
lastYearBase = 2100
fakeLastYearTime = (rank)->
  fakeDateYearString = (lastYearBase + rankNum rank).toString()
  return new Date(fakeDateYearString).getTime()

lastRank = 1000
rankNum = (rank)->
  if /^\d+$/.test rank then parseInt rank
  else lastRank
