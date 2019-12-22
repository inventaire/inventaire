const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { Promise } = __.require('lib', 'promises')
const { undesiredRes } = require('../utils/utils')
const { createWork, createEdition, createHuman, someOpenLibraryId } = require('../fixtures/entities')
const { getByUri, addClaim, updateClaim, removeClaim, merge } = require('../utils/entities')

describe('entities:update-claims', () => {
  it('should reject without uri', done => {
    updateClaim()
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: uri')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject without property', done => {
    const uri = 'inv:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    updateClaim(uri)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: property')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject without old-value or new-value', done => {
    const uri = 'inv:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const property = 'wdt:P1104'
    updateClaim(uri, property)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: old-value or new-value')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject invalid uri prefix', done => {
    const uri = 'invalidprefix:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const property = 'wdt:P1104'
    const oldValue = '1312'
    updateClaim(uri, property, oldValue)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('unsupported uri prefix')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject unfound entity', done => {
    const uri = 'inv:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const property = 'wdt:P1104'
    const oldValue = '1312'
    updateClaim(uri, property, oldValue)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('entity not found')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject an update with an inappropriate property', done => {
    createWork()
    // A work entity should not have pages count
    .then(work => addClaim(work.uri, 'wdt:P1104', 124))
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal("works can't have a property wdt:P1104")
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject an update with an inappropriate property datatype', done => {
    createWork()
    .then(work => {
      return addClaim(work.uri, 'wdt:P50', 124)
      .then(undesiredRes(done))
      .catch(err => {
        err.body.status_verbose.should.equal('invalid value type: expected string, got number')
        err.statusCode.should.equal(400)
        done()
      })
    })
    .catch(done)
  })

  it('should reject an update with an invalid property value', done => {
    createEdition()
    .then(edition => {
      return addClaim(edition.uri, 'wdt:P123', 'not an entity uri')
      .then(undesiredRes(done))
      .catch(err => {
        err.body.status_verbose.should.equal('invalid property value')
        err.statusCode.should.equal(400)
        done()
      })
    })
    .catch(done)
  })

  it('should reject an update removing a critical claim', done => {
    createEdition()
    .then(edition => {
      const oldValue = edition.claims['wdt:P629'][0]
      // An edition entity should always have at least one wdt:P629 claim
      return removeClaim(edition.uri, 'wdt:P629', oldValue)
      .then(undesiredRes(done))
    })
    .catch(err => {
      err.body.status_verbose.should.equal('this property should at least have one value')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject an update on an unexisting claim (property with no claim)', done => {
    createEdition()
    .then(edition => updateClaim(edition.uri, 'wdt:P655', 'wd:Q23', 'wd:Q42'))
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('claim property value not found')
      done()
    })
    .catch(done)
  })

  it('should reject an update on an unexisting claim (property with claims)', done => {
    createEdition()
    .tap(edition => addClaim(edition.uri, 'wdt:P655', 'wd:Q535'))
    .then(edition => updateClaim(edition.uri, 'wdt:P655', 'wd:Q23', 'wd:Q42'))
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('claim property value not found')
      done()
    })
    .catch(done)
  })

  it('should reject an update on an obsolete entity', done => {
    Promise.all([
      createWork(),
      createWork()
    ])
    .spread((workA, workB) => merge(workA.uri, workB.uri)
    .then(() => addClaim(workA.uri, 'wdt:P50', 'wd:Q535'))).then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('this entity is obsolete')
      done()
    })
    .catch(done)
  })

  it('should accept rapid updates on the same entity', done => {
    const authorsUris = [ 'wd:Q192214', 'wd:Q206685' ]
    createWork()
    .then(work => {
      return Promise.all(authorsUris.map(uri => addClaim(work.uri, 'wdt:P50', uri)))
      .then(responses => {
        responses.forEach(res => should(res.ok).be.true())
        return getByUri(work.uri)
      })
    })
    .then(updatedWork => {
      const addedAuthorsUris = updatedWork.claims['wdt:P50']
      authorsUris.forEach(uri => should(addedAuthorsUris.includes(uri)).be.true())
      done()
    })
    .catch(done)
  })

  it('should accept a non-duplicated concurrent value', done => {
    createHuman()
    .then(human => addClaim(human._id, 'wdt:P648', someOpenLibraryId()))
    .then(res => {
      should(res.ok).be.true()
      done()
    })
    .catch(done)
  })

  it('should reject invalid value for type-specific value formats', done => {
    createHuman()
    .then(human => {
      return updateClaim(human.uri, 'wdt:P648', null, someOpenLibraryId('work'))
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid property value for entity type human')
      done()
    })
    .catch(done)
  })

  it('should reject an update with a duplicated concurrent value', done => {
    const id = someOpenLibraryId()
    createHuman()
    .then(human => {
      return addClaim(human.uri, 'wdt:P648', id)
      .then(res => {
        should(res.ok).be.true()
        return createHuman()
      })
    })
    .then(human2 => addClaim(human2.uri, 'wdt:P648', id))
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('this property value is already used')
      done()
    })
    .catch(done)
  })
})
