_ = require('config').root.require 'builders', 'utils'

list =
  's': 'subject'
  'o': 'object'
  'p': 'predicate'

keys = Object.keys list
values = Object.keys _.invert(list)


unwrap = (triple)->
  # _.logBlue triple, 'triple'
  updated = _.omit triple, keys
  if triple.s? then updated.subject = triple.s
  if triple.o? then updated.object = triple.o
  if triple.p? then updated.predicate = triple.p
  # _.logGreen updated, 'updated'
  return updated

wrap = (triple)->
  # _.logBlue triple, 'triple'
  updated = _.omit triple, values
  if triple.subject? then updated.s = triple.subject
  if triple.object? then updated.o = triple.object
  if triple.predicate? then updated.p = triple.predicate
  # _.logGreen updated, 'updated'
  return updated

wrapAll = (obj)-> toggleAll(wrap, obj)
unwrapAll = (obj)-> toggleAll(unwrap, obj)

toggleAll = (method, obj)->
  switch
    when _.isArray(obj) then obj.map (triple)-> method(triple)
    when _.isObject(obj) then method(obj)
    else throw "expected array or object, got #{obj}"

module.exports =
  list: list
  keys: keys
  values: values
  wrap: wrap
  unwrap: unwrap
  wrapAll: wrapAll
  unwrapAll: unwrapAll