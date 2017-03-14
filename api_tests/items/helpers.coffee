CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
randomString = __.require 'lib', './utils/random_string'

module.exports =
  newItemBase: ->
    title: 'whatever' + randomString(2)
    entity: 'wd:Q3548806'

  CountChange: (snapBefore, snapAfter)-> (section)->
    before = snapBefore[section]['items:count']
    after = snapAfter[section]['items:count']
    return after - before
