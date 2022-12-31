import should from 'should'
import randomString from 'lib/utils/random_string'
import { getByUri, updateLabel, revertEdit, getHistory, addClaim } from '../utils/entities'
import { shouldNotBeCalled } from '../utils/utils'
import { createWork, createEditionWithIsbn } from '../fixtures/entities'

describe('entities:revert-edit', () => {
  it('should revert a label update', async () => {
    const { uri } = await createWork()
    const label = randomString(6)
    await updateLabel({ uri, lang: 'es', value: label })
    const lastPatchId = await getLastPatchId(uri)
    const res = await revertEdit({ patchId: lastPatchId })
    res.should.be.ok()
    const work = await getByUri(uri)
    should(work.labels.es).not.be.ok()
  })

  it('should revert a claim update', async () => {
    const { uri } = await createWork()
    await addClaim({ uri, property: 'wdt:P50', value: 'wd:Q1174579' })
    const lastPatchId = await getLastPatchId(uri)
    const res = await revertEdit({ patchId: lastPatchId })
    res.should.be.ok()
    const work = await getByUri(uri)
    should(work.claims['wdt:P50']).not.be.ok()
  })

  it('should reject reverts that would make P31 empty', async () => {
    const { uri } = await createWork()
    const lastPatchId = await getLastPatchId(uri)
    await revertEdit({ patchId: lastPatchId })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.deepEqual("wdt:P31 array can't be empty")
    })
  })

  it('should be able to revert when having a unique value claim', async () => {
    // Sets wdt:P212, which should be a unique value
    const { uri, _id } = await createEditionWithIsbn()
    const invUri = `inv:${_id}`
    await addClaim({ uri: invUri, property: 'wdt:P2635', value: 123 })
    const lastPatchId = await getLastPatchId(invUri)
    const res = await revertEdit({ patchId: lastPatchId })
    res.should.be.ok()
    const work = await getByUri(uri)
    should(work.claims['wdt:P2635']).not.be.ok()
  })
})

const getLastPatchId = async uri => {
  const history = await getHistory(uri)
  return history.at(-1)._id
}
