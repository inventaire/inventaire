const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { authReq, shouldNotBeCalled } = require('../utils/utils')
const randomString = __.require('lib', './utils/random_string')
const { getByUri, updateLabel, revertEdit, getHistory, addClaim } = require('../utils/entities')
const { createWork } = require('../fixtures/entities')

describe('entities:revert-edit', () => {
  it('should require admin rights', async () => {
    try {
      await authReq('put', '/api/entities?action=revert-edit').then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(403)
    }
  })

  it('should revert a label update', async () => {
    const { uri } = await createWork()
    const label = randomString(6)
    await updateLabel(uri, 'es', label)
    const lastPatchId = await getLastPatchId(uri)
    const res = await revertEdit(lastPatchId)
    res.should.be.ok()
    const work = await getByUri(uri)
    should(work.labels.es).not.be.ok()
  })

  it('should revert a claim update', async () => {
    const { uri } = await createWork()
    await addClaim(uri, 'wdt:P50', 'wd:Q1174579')
    const lastPatchId = await getLastPatchId(uri)
    const res = await revertEdit(lastPatchId)
    res.should.be.ok()
    const work = await getByUri(uri)
    should(work.claims['wdt:P50']).not.be.ok()
  })
})

const getLastPatchId = async uri => {
  const history = await getHistory(uri)
  return history.slice(-1)[0]._id
}
