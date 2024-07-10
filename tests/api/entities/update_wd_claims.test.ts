import { random } from 'lodash-es'
import should from 'should'
import wdk from 'wikibase-sdk/wikidata.org'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { someRandomImageHash } from '#fixtures/entities'
import { validateP31Update } from '#lib/wikidata/validate_wd_update'
import type { Url } from '#server/types/common'
import type { WdEntityId } from '#server/types/entity'
import { addClaim, getByUri, removeClaim, updateClaim } from '#tests/api/utils/entities'
import { request } from '#tests/api/utils/request'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const { cirrusSearchPages, parse } = wdk

async function getSomeWdEditionUri () {
  const url = cirrusSearchPages({
    haswbstatement: [ 'P31=Q3331189', 'P629' ],
    limit: 1,
    offset: random(0, 10000),
    prop: [],
  }) as Url
  const res = await request('get', url)
  const id = parse.pagesTitles(res)[0] as WdEntityId
  return prefixifyWd(id)
}

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

  describe('update local layer', () => {
    it('should add a local property claim', async () => {
      const uri = await getSomeWdEditionUri()
      const imageHash = someRandomImageHash()
      await addClaim({ uri, property: 'invp:P2', value: imageHash })
      const updatedEdition = await getByUri(uri)
      updatedEdition.claims['invp:P2'][0].should.equal(imageHash)
    })

    it('should update a local property claim', async () => {
      const uri = await getSomeWdEditionUri()
      const imageHashA = someRandomImageHash()
      const imageHashB = someRandomImageHash()
      await addClaim({ uri, property: 'invp:P2', value: imageHashA })
      await updateClaim({ uri, property: 'invp:P2', oldValue: imageHashA, newValue: imageHashB })
      const updatedEdition = await getByUri(uri)
      updatedEdition.claims['invp:P2'][0].should.equal(imageHashB)
    })

    it('should delete a local property claim', async () => {
      const uri = await getSomeWdEditionUri()
      const imageHash = someRandomImageHash()
      await addClaim({ uri, property: 'invp:P2', value: imageHash })
      await removeClaim({ uri, property: 'invp:P2', value: imageHash })
      const updatedEdition = await getByUri(uri)
      should(updatedEdition.claims['invp:P2']).not.be.ok()
    })

    it('should reject inv:P1 updates (with no layer existing)', async () => {
      const uri = await getSomeWdEditionUri()
      await addClaim({ uri, property: 'invp:P1', value: 'wd:Q1' })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('entity local layer linking property (invp:P1) can not be updated')
      })
    })

    it('should reject inv:P1 updates (with an existing layer)', async () => {
      const uri = await getSomeWdEditionUri()
      const imageHash = someRandomImageHash()
      await addClaim({ uri, property: 'invp:P2', value: imageHash })
      await updateClaim({ uri, property: 'invp:P1', oldValue: uri, newValue: 'wd:Q1' })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('entity local layer linking property (invp:P1) can not be updated')
      })
    })
  })
})
