const should = require('should')
const randomString = require('lib/utils/random_string')
const { getByUri, updateLabel, restoreVersion, getHistory, addClaim } = require('../utils/entities')
const { createWork } = require('../fixtures/entities')

describe('entities:restore', () => {
  it('should restore after label updates', async () => {
    const originalLabel = randomString(6)
    const { uri } = await createWork({ labels: { en: originalLabel } })
    await updateLabel({ uri, lang: 'en', value: randomString(6) })
    await updateLabel({ uri, lang: 'en', value: randomString(6) })
    const firstVersionPatchId = `${uri.split(':')[1]}:2`
    const res = await restoreVersion(firstVersionPatchId)
    res.should.be.ok()
    const work = await getByUri(uri)
    work.labels.en.should.equal(originalLabel)
    const restoredHistory = await getHistory(uri)
    restoredHistory.length.should.equal(4)
  })

  it('should restore after claim update', async () => {
    const { uri } = await createWork({ claims: { 'wdt:P50': [ 'wd:Q1174579' ] } })
    await addClaim(uri, 'wdt:P921', 'wd:Q3196867')
    await addClaim(uri, 'wdt:P50', 'wd:Q216092')
    const firstVersionPatchId = `${uri.split(':')[1]}:2`
    const res = await restoreVersion(firstVersionPatchId)
    res.should.be.ok()
    const work = await getByUri(uri)
    work.claims['wdt:P50'].should.deepEqual([ 'wd:Q1174579' ])
    should(work.claims['wdt:P921']).not.be.ok()
    const restoredHistory = await getHistory(uri)
    restoredHistory.length.should.equal(4)
  })
})
