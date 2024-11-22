import 'should'
import { formatClaimsForWikidata, reshapeMonolingualTextClaims, type EntityDraft } from '#controllers/entities/lib/create_wd_entity'
import { someReference } from '#fixtures/entities'
import { relocateQualifierProperties } from '#lib/wikidata/data_model_adapter'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

describe('wikidata data model converter', () => {
  describe('relocateQualifierProperties', () => {
    it('should pass when no serie ordinal is set', () => {
      relocateQualifierProperties({ })
    })

    it('should throw when no serie is set but a serie ordinal is', () => {
      try {
        relocateQualifierProperties({
          P1545: [ { value: '1' } ],
        })
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('a serie ordinal can not be move to Wikidata without a serie')
      }
    })

    it('should not throw when several series are set but no ordinal', () => {
      relocateQualifierProperties({
        P179: [ { value: 'Q1' }, { value: 'Q2' } ],
      })
    })

    it('should throw when several series are set with an ordinal', () => {
      try {
        relocateQualifierProperties({
          P179: [ { value: 'Q1' }, { value: 'Q2' } ],
          P1545: [ { value: '1' } ],
        })
        shouldNotBeCalled()
      } catch (err) {
        err.message.should.equal('a serie ordinal can not be set on several serie claims')
      }
    })

    it('should throw when several serie ordinals are set', () => {
      try {
        relocateQualifierProperties({
          P179: [ { value: 'Q1' } ],
          P1545: [ { value: '1' }, { value: '2' } ],
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
      relocateQualifierProperties(claims)
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

  describe('reshapeMonolingualTextClaims', () => {
    it('should reshape monolingual text claims', () => {
      const entity = {
        labels: {},
        claims: {
          'wdt:P31': [ { value: 'wd:Q3331189' } ],
          'wdt:P407': [ { value: 'wd:Q150' } ],
          'wdt:P1476': [ { value: "L'Eau et les rêves" } ],
          'wdt:P1680': [ { value: "Essai sur l'imagination de la matière" } ],
        },
      } as EntityDraft
      reshapeMonolingualTextClaims(entity.claims)
      entity.claims['wdt:P1476'][0].value.should.deepEqual({ text: "L'Eau et les rêves", language: 'fr' })
      entity.claims['wdt:P1680'][0].value.should.deepEqual({ text: "Essai sur l'imagination de la matière", language: 'fr' })
    })
  })

  describe('formatClaimsForWikidata', () => {
    it('should format claims to the wikibase-edit format', () => {
      const entity = {
        labels: {},
        claims: {
          'wdt:P31': [ { value: 'wd:Q3331189' } ],
          'wdt:P212': [ { value: '978-2-253-06099-4' } ],
          'wdt:P957': [ { value: '2-253-06099-2' } ],
          'wdt:P407': [ { value: 'wd:Q150' } ],
          'wdt:P1476': [ { value: "L'Eau et les rêves" } ],
          'wdt:P577': [ { value: '2009' } ],
          'wdt:P629': [ { value: 'wd:Q3202802' } ],
          'wdt:P1680': [ { value: "Essai sur l'imagination de la matière" } ],
        },
      } as EntityDraft
      const formattedClaims = formatClaimsForWikidata(entity.claims)
      formattedClaims.P31[0].value.should.equal('Q3331189')
      formattedClaims.P1476[0].value.should.deepEqual({ text: "L'Eau et les rêves", language: 'fr' })
      formattedClaims.P1680[0].value.should.deepEqual({ text: "Essai sur l'imagination de la matière", language: 'fr' })
    })
  })
})
