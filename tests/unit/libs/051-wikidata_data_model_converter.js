require('should')
const { relocateQualifierProperties } = require('lib/wikidata/data_model_adapter')
const { shouldNotBeCalled } = require('../utils')

describe('wikidata data model converter', () => {
  describe('relocateQualifierProperties', () => {
    it('should pass when no serie ordinal is set', () => {
      relocateQualifierProperties({ claims: {} })
    })

    it('should throw when no serie is set but a serie ordinal is', () => {
      try {
        relocateQualifierProperties({
          claims: {
            'wdt:P1545': [ '1' ]
          }
        })
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('a serie ordinal can not be move to Wikidata without a serie')
      }
    })

    it('should not throw when several series are set but no ordinal', () => {
      relocateQualifierProperties({
        claims: {
          'wdt:P179': [ 'wd:Q1', 'wd:Q2' ],
        }
      })
    })

    it('should throw when several series are set with an ordinal', () => {
      try {
        relocateQualifierProperties({
          claims: {
            'wdt:P179': [ 'wd:Q1', 'wd:Q2' ],
            'wdt:P1545': [ '1' ],
          }
        })
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('a serie ordinal can not be set on several serie claims')
      }
    })

    it('should throw when several serie ordinals are set', () => {
      try {
        relocateQualifierProperties({
          claims: {
            'wdt:P179': [ 'wd:Q1' ],
            'wdt:P1545': [ '1', '2' ],
          }
        })
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('can not import several serie ordinals')
      }
    })

    it('should move a serie ordinal as qualifier of a claim', () => {
      const claims = {
        'wdt:P179': [ 'wd:Q1' ],
        'wdt:P1545': [ '1' ],
      }
      relocateQualifierProperties({ claims })
      claims.should.deepEqual({
        'wdt:P179': {
          value: 'wd:Q1',
          qualifiers: {
            'wdt:P1545': '1',
          }
        }
      })
    })
  })
})
