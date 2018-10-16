CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

module.exports =
  newItemBase: -> { entity: 'wd:Q3548806', lang: 'fr' }

  CountChange: (snapBefore, snapAfter)-> (section)->
    before = snapBefore[section]['items:count']
    after = snapAfter[section]['items:count']
    return after - before
