CONFIG = require 'config'
__ = CONFIG.universalPath
require 'should'
{ matchTitle } = __.require 'controllers', 'entities/lib/scaffold_entity_from_seed/work_entity_search_utils'

result =
  labels:
    en: 'Lorem ipsum dolor sit amet'

volumeResult =
  labels:
    en: 'Lorem ipsum dolor sit amet Vol. 10'

describe 'work_entity_search_utils', ->
  describe 'matchTitle', ->
    it 'should be true on exact match', (done)->
      title = 'Lorem ipsum dolor sit amet'
      matchTitle(title, 'fr')(result).should.be.true()
      done()

    it 'should be true on close match', (done)->
      title = 'Lorem ipsum dolo sit amet'
      matchTitle(title, 'fr')(result).should.be.true()
      done()

    it 'should be true on volume exact match', (done)->
      title = 'Lorem ipsum dolor sit amet Vol. 10'
      matchTitle(title, 'fr')(volumeResult).should.be.true()
      done()

    it 'should be false on volume close match', (done)->
      title = 'Lorem ipsum dolor sit amet Vol. 1'
      matchTitle(title, 'fr')(volumeResult).should.be.false()
      done()
