const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { matchTitle } = __.require('controllers', 'entities/lib/scaffold_entity_from_seed/work_entity_search_utils')

const result = {
  labels: {
    en: 'Lorem ipsum dolor sit amet'
  }
}

const volumeResult = {
  labels: {
    en: 'Lorem ipsum dolor sit amet Vol. 10'
  }
}

describe('work_entity_search_utils', () => {
  describe('matchTitle', () => {
    it('should be true on exact match', () => {
      const title = 'Lorem ipsum dolor sit amet'
      matchTitle(title, 'fr')(result).should.be.true()
    })

    it('should be true on close match', () => {
      const title = 'Lorem ipsum dolo sit amet'
      matchTitle(title, 'fr')(result).should.be.true()
    })

    it('should be true on volume exact match', () => {
      const title = 'Lorem ipsum dolor sit amet Vol. 10'
      matchTitle(title, 'fr')(volumeResult).should.be.true()
    })

    it('should be false on volume close match', () => {
      const title = 'Lorem ipsum dolor sit amet Vol. 1'
      matchTitle(title, 'fr')(volumeResult).should.be.false()
    })
  })
})
