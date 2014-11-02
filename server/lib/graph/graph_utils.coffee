_ = require('config').root.require 'builders', 'utils'


module.exports =
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

  extract:
    subjects: (triples)-> _.extract triples, 's'
    objects: (triples)-> _.extract triples, 'o'
    predicates: (triples)-> _.extract triples, 'p'
    first:
      subject: (triples)-> triples[0]?.s
      object: (triples)-> triples[0]?.o
      predicate: (triples)-> triples[0]?.p