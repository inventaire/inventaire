__ = require('config').universalPath
_ = __.require 'builders', 'utils'
designDocName = 'patches'
db = __.require('couch', 'base')('patches', designDocName)
Patch = __.require 'models', 'patch'
Entity = __.require 'models', 'entity'
promises_ = __.require 'lib', 'promises'
{ maxKey } = __.require 'lib', 'couch'
{ oneDay } =  __.require 'lib', 'times'

module.exports = patches_ =
  db: db
  byId: db.get
  byEntityIds: (entityIds)-> db.viewByKeys 'byEntityId', entityIds
  byUserId: (userId, limit, offset)->
    db.view designDocName, 'byUserId',
      startkey: [ userId, maxKey ]
      endkey: [ userId ]
      include_docs: true
      descending: true
      reduce: false
    .then (res)->
      { rows } = res
      rangeStart = offset
      rangeEnd = offset + limit
      subset = rows.slice rangeStart, rangeEnd
      data =
        patches: _.pluck subset, 'doc'
        total: rows.length
      if rangeEnd < data.total then data.continue = rangeEnd
      return data

  create: (userId, currentDoc, updatedDoc)->
    promises_.try -> Patch.create userId, currentDoc, updatedDoc
    .then db.postAndReturn

  getSnapshots: (entityId)->
    byEntityId entityId
    .then (patchDocs)->
      base = Entity.create()
      return Patch.getSnapshots base, patchDocs

  getGlobalActivity: ->
    db.view designDocName, 'byUserId', { group_level: 1 }
    .get 'rows'
    .map formatRow
    .then sortAndFilterContributions
    # Return only the first hundred results
    .then (rows)-> rows.slice 0, 100

  getActivityFromLastDay: (days)->
    _.type days, 'number'
    now = Date.now()
    startTime = now - oneDay * days
    today = _.simpleDay()
    startDay = _.simpleDay startTime
    db.view designDocName, 'byDay',
      group_level: 2
      startkey: [ startDay ]
      endkey: [ today, maxKey ]
    .get 'rows'
    .then (rows)-> convertToArray rows.reduce(aggregatePeriodContributions, {})
    .then (activity)-> { activity, start: startDay, end: today }

byEntityId = (entityId)-> db.viewByKey 'byEntityId', entityId

formatRow = (row)-> { user: row.key[0], contributions: row.value }

aggregatePeriodContributions = (counts, row)->
  userId = row.key[1]
  contributions = row.value
  counts[userId] ?= 0
  counts[userId] += contributions
  return counts

convertToArray = (counts)->
  data = []
  for userId, contributions of counts
    data.push { user: userId, contributions }
  return sortAndFilterContributions data

sortAndFilterContributions = (rows)->
  rows
  .filter noSpecialUser
  .sort (a, b)-> b.contributions - a.contributions

# Filtering-out special users automated contributions
# see server/db/couch/hard_coded_documents.coffee
noSpecialUser = (row)-> not row.user.startsWith('000000000000000000000000000000')
