const should = require('should')
const { authReq, shouldNotBeCalled, dataadminReq } = require('../utils/utils')
const randomString = require('lib/utils/random_string')
const { getByUris, merge, revertMerge, updateLabel, addClaim } = require('../utils/entities')
const { createWork, createHuman, createWorkWithAuthor } = require('../fixtures/entities')

describe('entities:revert-merge', () => {
  it('should require data admin rights', async () => {
    await authReq('put', '/api/entities?action=revert-merge')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
    })
  })

  it('should reject without "from" uri', async () => {
    // Not using utils/entities `revertMerge` function to avoid getting an error from `assert_.string(fromUri)`
    await dataadminReq('put', '/api/entities?action=revert-merge', {})
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: from')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject invalid prefix', async () => {
    await revertMerge('wd:Q42')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("invalid 'from' uri domain: wd. Accepted domains: inv")
      err.statusCode.should.equal(400)
    })
  })

  it('should revert merge two entities with an inv URI', async () => {
    const [ workA, workB ] = await Promise.all([
      createWork(),
      createWork()
    ])
    await merge(workA.uri, workB.uri)
    const res = await getByUris(workA.uri)
    res.redirects[workA.uri].should.equal(workB.uri)
    res.entities[workB.uri].should.be.ok()
    await revertMerge(workA.uri)
    const res2 = await getByUris(workA.uri)
    should(res2.redirects[workA.uri]).not.be.ok()
    res2.entities[workA.uri].should.be.ok()
  })

  it('should revert claims transfer', async () => {
    const [ workA, workB, author ] = await Promise.all([
      createWork(),
      createWork(),
      createHuman()
    ])
    await addClaim(workA.uri, 'wdt:P50', author.uri)
    await merge(workA.uri, workB.uri)
    const res = await getByUris(workB.uri)
    const authorsUris = res.entities[workB.uri].claims['wdt:P50']
    authorsUris.should.deepEqual([ author.uri ])
    await revertMerge(workA.uri)
    const res2 = await getByUris(workB.uri)
    const authorsUris2 = res2.entities[workB.uri].claims['wdt:P50']
    should(authorsUris2).not.be.ok()
  })

  it('should revert labels transfer', async () => {
    const label = randomString(6)
    const [ workA, workB ] = await Promise.all([
      createWork({ labels: { zh: label } }),
      createWork()
    ])
    await merge(workA.uri, workB.uri)
    const res = await getByUris(workB.uri)
    res.entities[workB.uri].labels.zh.should.equal(label)
    await revertMerge(workA.uri)
    const res2 = await getByUris(workB.uri)
    should(res2.entities[workB.uri].labels.zh).not.be.ok()
  })

  it('should revert claim transfers, even when several patches away', async () => {
    const [ workA, workB, authorA, authorB ] = await Promise.all([
      createWork(),
      createWork(),
      createHuman(),
      createHuman()
    ])
    await addClaim(workA.uri, 'wdt:P50', authorA.uri)
    await merge(workA.uri, workB.uri)
    const res = await getByUris(workB.uri)
    const authorsUris = res.entities[workB.uri].claims['wdt:P50']
    authorsUris.should.deepEqual([ authorA.uri ])
    // Make another edit between the merge and the revert-merge
    await addClaim(workB.uri, 'wdt:P50', authorB.uri)
    await revertMerge(workA.uri)
    const res2 = await getByUris(workB.uri)
    const authorsUris2 = res2.entities[workB.uri].claims['wdt:P50']
    authorsUris2.should.deepEqual([ authorB.uri ])
  })

  it('should revert labels transfer', async () => {
    const labelA = randomString(6)
    const labelB = randomString(6)
    const [ workA, workB ] = await Promise.all([
      createWork({ labels: { zh: labelA } }),
      createWork()
    ])
    await merge(workA.uri, workB.uri)
    const res = await getByUris(workB.uri)
    res.entities[workB.uri].labels.zh.should.equal(labelA)
    // Make another edit between the merge and the revert-merge
    await updateLabel(workB.uri, 'nl', labelB)
    await revertMerge(workA.uri)
    const res2 = await getByUris(workB.uri)
    should(res2.entities[workB.uri].labels.zh).not.be.ok()
  })

  it('should revert redirected claims', async () => {
    const [ humanA, humanB, work ] = await Promise.all([
      createHuman(),
      createHuman(),
      createWork()
    ])
    await addClaim(work.uri, 'wdt:P50', humanA.uri)
    await merge(humanA.uri, humanB.uri)
    await revertMerge(humanA.uri)
    const res = await getByUris(work.uri)
    const authorsUris = res.entities[work.uri].claims['wdt:P50']
    authorsUris.should.deepEqual([ humanA.uri ])
  })

  it('should restore removed human placeholders', async () => {
    const [ workA, workB ] = await Promise.all([
      createWorkWithAuthor(),
      createWorkWithAuthor()
    ])
    const humanAUri = workA.claims['wdt:P50'][0]
    await merge(workA.uri, workB.uri)
    await revertMerge(workA.uri)
    const res = await getByUris([ workA.uri, humanAUri ])
    const humanA = res.entities[humanAUri]
    const updatedWorkA = res.entities[workA.uri]
    should(humanA._meta_type).not.be.ok()
    updatedWorkA.claims['wdt:P50'].should.deepEqual([ humanAUri ])
  })
})
