module.exports =
  getSimpleDayDate: (date)->
    # Parse ISO date
    date?.split('T')[0]
    # If the date is a January 1st, it's very probably because
    # its a year-precision date
    .replace '-01-01', ''

  sortByDate: (a, b)-> formatDate(a) - formatDate(b)

formatDate = (obj)->
  { date } = obj
  if date? then new Date(date).getTime()
  else latestYear

# If no date is available, make it appear last by providing a date in the future
# To update once we will have passed the year 2100
latestYear = new Date('2100')
