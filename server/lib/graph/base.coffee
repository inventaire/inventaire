CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')


if CONFIG.env is 'tests'
  level = require 'level-test'
else
  level = require 'level'

levelgraph = require 'levelgraph'

Promise = require 'bluebird'
Promise.longStackTraces()
Promise.onPossiblyUnhandledRejection (err)-> throw new Error(err)

aliases =
  's': 'subject'
  'o': 'object'
  'p': 'predicate'

aliasesKeys = Object.keys(aliases)

replaceAliases = (obj)->
  switch
    when _.isArray(obj) then obj.map (triple)-> replaceAlias(triple)
    when _.isObject(obj) then replaceAlias(obj)
    else throw "expected array or object, got #{obj}"

replaceAlias = (triple)->
  # _.logBlue triple, 'triple'
  updated = _.omit triple, aliasesKeys
  if triple.s? then updated.subject = triple.s
  if triple.o? then updated.object = triple.o
  if triple.p? then updated.predicate = triple.p
  # _.logGreen updated, 'updated'
  return updated



module.exports = (graphName)->
  dbPath = __.path.leveldb(graphName)
  _.logBlue dbPath, 'dbPath'

  db = level(dbPath)
  _.logBlue db, 'db'

  graph = levelgraph(db)
  _.logBlue graph, 'graph'

  action = (verb, obj)->
    # obj: GET-> query, PUT-DEL-> triple
    obj = replaceAliases(obj)
    def = Promise.defer()
    # _.logBlue obj, verb
    graph[verb] obj, (err, result)->
      if err then def.reject(err)
      else
        # _.logGreen result, "#{verb}: success!"
        def.resolve(result)
    return def.promise

  inspectDb = ->
    db.createReadStream()
    .on 'data', (data) -> _.log data.value, data.key
    .on 'error', (err) -> _.log err, 'err at inspectDb'
    .on 'close', -> _.log 'Stream closed'
    .on 'end', -> _.log 'Stream end'

  API =
    # query example: { subject: "a", limit: 4, offset: 2, filter: ()-> }
    get: (query)-> action 'get', query
    put: (triple)-> action 'put', triple
    del: (triple)-> action 'del', triple
    db: db
    inspectDb: inspectDb
    graph: graph
    aliases: aliases
    aliasesKeys: aliasesKeys
    replaceAliases: replaceAliases
    replaceAlias: replaceAlias

  return API