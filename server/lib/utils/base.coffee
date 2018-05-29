_ = require 'lodash'

module.exports = base =
  combinations: (array1, array2)->
    @types arguments, [ 'array', 'array' ]
    results = []
    for keys1 in array1
      for keys2 in array2
        results.push [ keys1, keys2 ]
    return results

  sumValues: (obj)->
    if @objLength(obj) > 0
      @values(obj)?.reduce (a, b)-> a + b
    else 0

  sameObjects: (a, b)-> JSON.stringify(a) is JSON.stringify(b)

  toLowerCase: (str)-> str.toLowerCase()

  stringToInt: (str)->
    unless typeof str is 'string' then throw new Error "expected a string: #{str}"
    # testing the validity of the string is needed
    # to avoid getting NaN from parseInt
    unless /^-?\d+$/.test str then throw new Error "invalid integer string: #{str}"
    return parseInt str

  parsePositiveInteger: (str)->
    # /!\ Difference with parseInt: not throwing
    unless typeof str is 'string' and /^\d+$/.test(str) then return
    return parseInt str

  stringToFloat: (str)->
    unless typeof str is 'string' then throw new Error "expected a string: #{str}"
    unless /^[-?\d\.]+$/.test str then throw new Error "invalid integer string: #{str}"
    return parseFloat str

  isArrayLike: (obj)-> _.isArray(obj) or _.isArguments(obj)

  # Remove any superfluous spaces
  superTrim: (str)->
    str
    .replace /^\s+/, ' '
    .replace /\s+$/, ' '
    .replace /\s+/g, ' '
    .trim()

  flattenIndexes: (indexesArray)->
    indexesArray.unshift {}
    return _.extend.apply _, indexesArray

  IndexBy: (attribute)-> (array)-> _.indexBy array, attribute

  initCollectionsIndex: (names)-> names.reduce aggregateCollections, {}

  indexAppliedValue: (array, fn)->
    return array.reduce aggragateFnApplication(fn), {}

aggregateCollections = (index, name)->
  index[name] = []
  return index

aggragateFnApplication = (fn)-> (index, value)->
  index[value] = fn value
  return index

base.objDiff = -> not base.sameObjects.apply(null, arguments)
