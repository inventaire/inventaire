import 'should'
import { createWork, someOpenLibraryId } from '../fixtures/entities.js'
import { getByUri, addClaim } from '../utils/entities.js'

describe('entities:add-claim', () => {
  it('should add a claim', async () => {
    const { uri } = await createWork()
    const openlibraryId = someOpenLibraryId('work')
    const res = await addClaim({ uri, property: 'wdt:P648', value: openlibraryId })
    res.ok.should.be.true()
    const updatedEntity = await getByUri(uri)
    updatedEntity.claims['wdt:P648'][0].should.equal(openlibraryId)
  })
})
