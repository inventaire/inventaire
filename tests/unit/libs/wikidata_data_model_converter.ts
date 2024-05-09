import 'should'
import { someReference } from '#fixtures/entities'
import { relocateQualifierProperties } from '#lib/wikidata/data_model_adapter'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

describe('wikidata data model converter', () => {
  describe('relocateQualifierProperties', () => {
    it('should pass when no serie ordinal is set', () => {
      relocateQualifierProperties({ claims: {} })
    })

    it('should throw when no serie is set but a serie ordinal is', () => {
      try {
        relocateQualifierProperties({
          claims: {
            P1545: [ { value: '1' } ],
          },
        })
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('a serie ordinal can not be move to Wikidata without a serie')
      }
    })

    it('should not throw when several series are set but no ordinal', () => {
      relocateQualifierProperties({
        claims: {
          P179: [ { value: 'Q1' }, { value: 'Q2' } ],
        },
      })
    })

    it('should throw when several series are set with an ordinal', () => {
      try {
        relocateQualifierProperties({
          claims: {
            P179: [ { value: 'Q1' }, { value: 'Q2' } ],
            P1545: [ { value: '1' } ],
          },
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
            P179: [ { value: 'Q1' } ],
            P1545: [ { value: '1' }, { value: '2' } ],
          },
        })
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('can not import several serie ordinals')
      }
    })

    it('should move a serie ordinal as qualifier of a claim', () => {
      const claims = {
        P179: [ { value: 'Q1', references: [ someReference ] } ],
        P1545: [ { value: '1' } ],
      }
      relocateQualifierProperties({ claims })
      claims.should.deepEqual({
        P179: [
          {
            value: 'Q1',
            references: [ someReference ],
            qualifiers: {
              P1545: [ '1' ],
            },
          },
        ],
      }
      )
    })
  })
})
