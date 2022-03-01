const should = require('should')
const randomString = require('lib/utils/random_string')
const { getByUri, updateLabel, restoreVersion, getHistory, addClaim } = require('../utils/entities')
const { createWork } = require('../fixtures/entities')
const { getUserA, getUserB } = require('../utils/utils')

describe('entities:restore', () => {
  it('should restore after label updates', async () => {
    const originalLabel = randomString(6)
    const [ userA, userB ] = await Promise.all([ getUserA(), getUserB() ])
    const { uri } = await createWork({ user: userA, labels: { en: originalLabel } })
    await updateLabel({ user: userB, uri, lang: 'en', value: randomString(6) })
    await updateLabel({ user: userA, uri, lang: 'en', value: randomString(6) })
    const firstVersionPatchId = `${uri.split(':')[1]}:2`
    const res = await restoreVersion({ user: userB, patchId: firstVersionPatchId })
    res.should.be.ok()
    const work = await getByUri(uri)
    work.labels.en.should.equal(originalLabel)
    const restoredHistory = await getHistory(uri)
    restoredHistory.length.should.equal(4)
  })

  it('should restore after claim update', async () => {
    const [ userA, userB ] = await Promise.all([ getUserA(), getUserB() ])
    const { uri } = await createWork({ user: userA, claims: { 'wdt:P50': [ 'wd:Q1174579' ] } })
    await addClaim({ user: userB, uri, property: 'wdt:P921', value: 'wd:Q3196867' })
    await addClaim({ user: userA, uri, property: 'wdt:P50', value: 'wd:Q216092' })
    const firstVersionPatchId = `${uri.split(':')[1]}:2`
    const res = await restoreVersion({ user: userB, patchId: firstVersionPatchId })
    res.should.be.ok()
    const work = await getByUri(uri)
    work.claims['wdt:P50'].should.deepEqual([ 'wd:Q1174579' ])
    should(work.claims['wdt:P921']).not.be.ok()
    const restoredHistory = await getHistory(uri)
    restoredHistory.length.should.equal(4)
  })
})
