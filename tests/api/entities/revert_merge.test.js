const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { Promise } = __.require('lib', 'promises')
const { authReq, undesiredRes } = require('../utils/utils')
const randomString = __.require('lib', './utils/random_string')
const { getByUris, merge, revertMerge, updateLabel, addClaim } = require('../utils/entities')
const { createWork, createHuman, createWorkWithAuthor } = require('../fixtures/entities')

describe('entities:revert-merge', () => {
  it('should require admin rights', done => {
    authReq('put', '/api/entities?action=revert-merge')
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(403)
      done()
    })
  })

  it('should reject without from uri', done => {
    revertMerge()
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: from')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject invalid prefix', done => {
    revertMerge('wd:Q42')
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal("invalid 'from' uri domain: wd. Accepted domains: inv")
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should revert merge two entities with an inv URI', done => {
    Promise.all([
      createWork(),
      createWork()
    ])
    .spread((workA, workB) => {
      merge(workA.uri, workB.uri)
      .then(() => getByUris(workA.uri))
      .then(res => {
        res.redirects[workA.uri].should.equal(workB.uri)
        res.entities[workB.uri].should.be.ok()
        revertMerge(workA.uri)
        .then(() => getByUris(workA.uri))
        .then(res => {
          should(res.redirects[workA.uri]).not.be.ok()
          res.entities[workA.uri].should.be.ok()
          done()
        })
      })
    })
    .catch(done)
  })

  it('should revert claims transfer', done => {
    Promise.all([
      createWork(),
      createWork(),
      createHuman()
    ])
    .spread((workA, workB, author) => {
      return addClaim(workA.uri, 'wdt:P50', author.uri)
      .then(() => merge(workA.uri, workB.uri))
      .then(() => getByUris(workB.uri))
      .then(res => {
        const authorsUris = res.entities[workB.uri].claims['wdt:P50']
        authorsUris.should.deepEqual([ author.uri ])
        return revertMerge(workA.uri)
        .then(() => getByUris(workB.uri))
        .then(res => {
          const authorsUris = res.entities[workB.uri].claims['wdt:P50']
          should(authorsUris).not.be.ok()
          done()
        })
      })
    })
    .catch(done)
  })

  it('should revert labels transfer', done => {
    const label = randomString(6)
    Promise.all([
      createWork({ labels: { zh: label } }),
      createWork()
    ])
    .spread((workA, workB) => {
      return merge(workA.uri, workB.uri)
      .then(() => getByUris(workB.uri))
      .then(res => {
        res.entities[workB.uri].labels.zh.should.equal(label)
        return revertMerge(workA.uri)
        .then(() => getByUris(workB.uri))
      })
      .then(res => {
        should(res.entities[workB.uri].labels.zh).not.be.ok()
        done()
      })
    })
    .catch(done)
  })

  it('should revert claim transfers, even when several patches away', done => {
    Promise.all([
      createWork(),
      createWork(),
      createHuman(),
      createHuman()
    ])
    .spread((workA, workB, authorA, authorB) => {
      return addClaim(workA.uri, 'wdt:P50', authorA.uri)
      .then(() => merge(workA.uri, workB.uri))
      .then(() => getByUris(workB.uri))
      // Make another edit between the merge and the revert-merge
      .tap(() => addClaim(workB.uri, 'wdt:P50', authorB.uri))
      .then(res => {
        const authorsUris = res.entities[workB.uri].claims['wdt:P50']
        authorsUris.should.deepEqual([ authorA.uri ])
        return revertMerge(workA.uri)
        .then(() => getByUris(workB.uri))
        .then(res => {
          const authorsUris = res.entities[workB.uri].claims['wdt:P50']
          authorsUris.should.deepEqual([ authorB.uri ])
          done()
        })
      })
    })
    .catch(done)
  })

  it('should revert labels transfer', done => {
    const labelA = randomString(6)
    const labelB = randomString(6)
    Promise.all([
      createWork({ labels: { zh: labelA } }),
      createWork()
    ])
    .spread((workA, workB) => {
      return merge(workA.uri, workB.uri)
      .then(() => getByUris(workB.uri))
      // Make another edit between the merge and the revert-merge
      .tap(() => updateLabel(workB.uri, 'nl', labelB))
      .then(res => {
        res.entities[workB.uri].labels.zh.should.equal(labelA)
        return revertMerge(workA.uri)
        .then(() => getByUris(workB.uri))
      })
      .then(res => {
        should(res.entities[workB.uri].labels.zh).not.be.ok()
        done()
      })
    })
    .catch(done)
  })

  it('should revert redirected claims', done => {
    Promise.all([
      createHuman(),
      createHuman(),
      createWork()
    ])
    .spread((humanA, humanB, work) => {
      return addClaim(work.uri, 'wdt:P50', humanA.uri)
      .then(() => merge(humanA.uri, humanB.uri))
      .then(() => revertMerge(humanA.uri))
      .then(() => getByUris(work.uri))
      .then(res => {
        const authorsUris = res.entities[work.uri].claims['wdt:P50']
        authorsUris.should.deepEqual([ humanA.uri ])
        done()
      })
    })
    .catch(done)
  })

  it('should restore removed human placeholders', done => {
    Promise.all([
      createWorkWithAuthor(),
      createWorkWithAuthor()
    ])
    .spread((workA, workB) => {
      const humanAUri = workA.claims['wdt:P50'][0]
      return merge(workA.uri, workB.uri)
      .then(() => revertMerge(workA.uri))
      .then(() => getByUris([ workA.uri, humanAUri ]))
      .then(res => {
        const humanA = res.entities[humanAUri]
        workA = res.entities[workA.uri]
        should(humanA._meta_type).not.be.ok()
        workA.claims['wdt:P50'].should.deepEqual([ humanAUri ])
        done()
      })
    })
    .catch(done)
  })
})
