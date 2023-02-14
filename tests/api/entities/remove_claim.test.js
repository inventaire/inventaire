import should from 'should'
import { createWork, someOpenLibraryId } from '../fixtures/entities.js'
import { getByUri, addClaim, removeClaim } from '../utils/entities.js'

// For the internals, see ./add_update_remove_claim.test.js
describe('entities:remove-claim interface', () => {
  it('should remove a claim', async () => {
    const { uri } = await createWork()
    const openlibraryId = someOpenLibraryId('work')
    await addClaim({ uri, property: 'wdt:P648', value: openlibraryId })
    const res = await removeClaim({ uri, property: 'wdt:P648', value: openlibraryId })
    res.ok.should.be.true()
    const updatedEntity = await getByUri(uri)
    should(updatedEntity.claims['wdt:P648']).not.be.ok()
  })
})
