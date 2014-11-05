_ = require('config').root.require 'builders', 'utils'


module.exports =
  aliases: require './aliases'
  mirrorTriple: (triple)->
    unless @isShortened(triple)
      throw new Error('wrong API: should be shortened')
    mirror = {}
    mirror.s = triple.o  if triple.o?
    mirror.p = triple.p  if triple.p?
    mirror.o = triple.s  if triple.s?
    return mirror

  isShortened: (triple)->
    if triple.subject? or triple.object? or triple.predicate?
      return false
    else true

  isTriple: (obj)->
    result = false

    if _.isObject obj
      if obj.s? and obj.o? and obj.p?
        result = true

      # shouldnt be used for coherance
      if obj.subject? and obj.object? and obj.predicate?
        console.warn 'please prefer s, o, p to subject, object, predicate'
        result = true

    return result

  addMirrorTriples: (triples)->
    if @isTriple(triples)
      triples = [triples]

    if _.typeArray triples
      mirrorTriples = []
      triples.forEach (triple)=>
        mirrorTriples.push @mirrorTriple(triple)

      return triples.concat mirrorTriples

  normalizeInterface: (args, unwrap)->
    # spreaded interface: args map to [s, p, o]
    # allows args like ['foo', null, 'bar']
    if _.areStringsOrFalsy(args)
      obj = @convertSpreadedInterface(args)
    else
      if args.length > 1
        throw 'unrecognized interface'
      # GET-> args[query]
      # PUT-DEL-> args[triple] or args[[triples...]]
      obj = args[0]

    # from s, p, o to subject, predicate, object
    # as this is the interface required by levelgraph
    if unwrap then return @aliases.unwrapAll(obj)
    else return obj

  convertSpreadedInterface: (args)->
    [s, p, o] = args
    obj = {}
    obj.s = s  if s?
    obj.p = p  if p?
    obj.o = o  if o?
    return obj

  pluck:
    subjects: (triples)-> _.pluck triples, 's'
    objects: (triples)-> _.pluck triples, 'o'
    predicates: (triples)-> _.pluck triples, 'p'
    first:
      subject: (triples)-> triples[0]?.s
      object: (triples)-> triples[0]?.o
      predicate: (triples)-> triples[0]?.p

  logDb: ->
    @leveldb.createReadStream()
    .on 'data', (data) -> _.log data.value, data.key
    .on 'error', (err) -> _.log err, 'err at logDb'
    .on 'close', -> _.log 'Stream closed'
    .on 'end', -> _.log 'Stream end'