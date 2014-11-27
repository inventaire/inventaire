CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')


levelgraph = require 'levelgraph'

promises_ = __.require 'lib', 'promises'
Promise = promises_.Promise

levelBase = __.require('level', 'base')
graph_ = require './graph_utils'


module.exports = (graphName)->
  db = levelBase.raw(graphName)
  graph = levelgraph(db)

  action = (verb, args)->
    obj = graph_.normalizeInterface(args, true)
    def = Promise.defer()
    # _.info obj, verb
    graph[verb] obj, (err, result)->
      if err then def.reject(err)
      else
        # result exist only on GET
        if result?
          result = graph_.aliases.wrapAll(result)

        def.resolve(result)
    return def.promise

  actions =
    # query example: { subject: "a", limit: 4, offset: 2, filter: ()-> }
    get: (args...)-> action 'get', args
    put: (args...)-> action 'put', args
    del: (args...)-> action 'del', args


  bidirectionals =
    getBidirectional: (args...)->
      query = graph_.normalizeInterface(args)
      # EXPECT short form: s, p, o
      # EXPECT a subject and a predicate
      # RETURNS an array of subjet and/or object
      unless query.s? and query.p?
        err = 'missing subject or predicate'
        return promises_.rejectedPromise(err)

      query2 = graph_.mirrorTriple(query)
      # _.info [query, query2], 'query & mirror '

      promise1 = @get query
      promise2 = @get query2
      return Promise.all([promise1, promise2])
      .spread (fromSubject, fromObject)->
        results1 = graph_.pluck.objects(fromSubject)
        results2 = graph_.pluck.subjects(fromObject)
        result = _.uniq results1.concat(results2)
        return _.success result, 'bidirectional result'

    # PUT once with an arbitrary direction
    # getBidirectional or delBidirectional will find it
    # it should just be agreed that a type of relation
    # is a mutual relation
    # thus 'putBidirectional' is just an alias of 'put'
    putBidirectional: actions.put

    delBidirectional: (args...)->
      triples = graph_.normalizeInterface(args)
      triples = graph_.addMirrorTriples(triples)
      return @del triples

  tools =
    utils: graph_
    leveldb: db
    logDb: graph_.logDb
    graph: graph

  return _.extend actions, bidirectionals, tools