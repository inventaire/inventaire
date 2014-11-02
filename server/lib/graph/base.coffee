CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')


levelgraph = require 'levelgraph'

Promise = require 'bluebird'

aliases = require './aliases'
_g = require './graph_utils'


module.exports = (graphName)->

  if CONFIG.env is 'tests'
    level = require('level-test')()
    leveldb = level()
  else
    level = require 'level'
    dbPath = __.path 'leveldb', graphName
    _.logBlue dbPath, 'dbPath'

    leveldb = level(dbPath)

  graph = levelgraph(leveldb)
  _.logBlue graph, 'graph'

  action = (verb, obj)->
    # obj: GET-> query, PUT-DEL-> triple
    obj = aliases.unwrapAll(obj)
    def = Promise.defer()
    _.logBlue obj, verb
    graph[verb] obj, (err, result)->
      if err then def.reject(err)
      else
        _.logGreen result, "#{verb}: success!"

        if result?
          _.logGreen result, "#{verb}: wrap"
          result = aliases.wrapAll(result)

        def.resolve(result)
    return def.promise

  getBidirectional = (query)->
    # EXPECT short form: s, p, o
    unless query.s? and query.p?
      return Promise.defer().reject('missing subject or predicate')

    query2 = _g.mirrorTriple(query)

    _.logBlue query, 'query1'
    _.logBlue query2, 'query2'

    # should rather reject as this method returns a promise, right?
    promise1 = @get query
    promise2 = @get query2
    return Promise.all([promise1, promise2])
    .spread (fromSubject, fromObject)->
      results1 = _g.extract.objects(fromSubject)
      results2 = _g.extract.subjects(fromObject)
      result = _.toSet results1.concat(results2)
      return _.logGreen result, 'bidirectional result'

  # PUT once with an arbitrary direction
  # getBidirectional or delBidirectional will find it
  # it should just be agreed that a type of relation
  # is a mutual relation
  putBidirectional = @put

  delBidirectional = (triples)->
    return @del _g.addMirrorTriples(triples)

  logDb = ->
    leveldb.createReadStream()
    .on 'data', (data) -> _.log data.value, data.key
    .on 'error', (err) -> _.log err, 'err at logDb'
    .on 'close', -> _.log 'Stream closed'
    .on 'end', -> _.log 'Stream end'

  API =
    # query example: { subject: "a", limit: 4, offset: 2, filter: ()-> }
    get: (query)-> action 'get', query
    put: (triple)-> action 'put', triple
    del: (triple)-> action 'del', triple
    getBidirectional: getBidirectional
    putBidirectional: putBidirectional
    delBidirectional: delBidirectional
    utils: _g
    leveldb: leveldb
    logDb: logDb
    graph: graph
    aliases: aliases

  return API