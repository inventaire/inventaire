import 'should'
import { validateP31Update } from '#lib/wikidata/validate_wd_update'
import { shouldNotBeCalled } from '#tests/unit/utils'

describe('entities:update-claims:wd', () => {
  describe('validateP31Update', () => {
    it('should reject removing the last typing P31', () => {
      try {
        validateP31Update({ wdtP31Array: [ 'wd:Q5' ], oldValue: 'wd:Q5', newValue: null })
        shouldNotBeCalled()
      } catch (err) {
        err.statusCode.should.equal(400)
        err.message.should.containEql("wdt:P31 array can't be empty")
      }
    })

    // This should be covered by validateWdEntityUpdate call to validateClaimValueSync
    // it('should reject changing type by changing the P31 value', () => {})

    it('should reject changing type by removing an extra value', () => {
      try {
        validateP31Update({ wdtP31Array: [ 'wd:Q3331189', 'wd:Q47461344' ], oldValue: 'wd:Q3331189', newValue: null })
        shouldNotBeCalled()
      } catch (err) {
        err.statusCode.should.equal(400)
        err.message.should.containEql("This edit would change the entity's type")
      }
    })
  })
})
