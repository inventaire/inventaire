const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const faker = require('faker')
const { Promise, Wait } = __.require('lib', 'promises')
const { nonAuthReq, authReq, undesiredRes, getUser } = require('../utils/utils')
const randomString = __.require('lib', './utils/random_string')
const { createWork, createHuman, createSerie, randomLabel, createEditionFromWorks } = require('../fixtures/entities')
const { getRefreshedPopularityByUris } = require('../utils/entities')

describe('search:global', () => {
  it('should reject empty searches', done => {
    nonAuthReq('get', '/api/search?lang=fr&types=works')
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: search')
      done()
    })
    .catch(done)
  })

  it('should reject search without types', done => {
    nonAuthReq('get', '/api/search?search=yo&lang=fr')
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: types')
      done()
    })
    .catch(done)
  })

  it('should reject invalid types', done => {
    search('da', 'yo')
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid types: da')
      done()
    })
    .catch(done)
  })

  it('should return a wikidata human', done => {
    search('humans', 'Gilles Deleuze')
    .then(results => {
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('humans'))
      _.map(results, 'id').includes('Q184226').should.be.true()
      done()
    })
    .catch(done)
  })

  it('should return a local human', done => {
    const label = randomString(5)
    createHuman({ labels: { fr: label } })
    // Let the time for Elastic Search indexation
    .then(Wait(4000))
    .then(entity => {
      return search('humans', label)
      .then(results => {
        results.should.be.an.Array()
        results.forEach(result => result.type.should.equal('humans'))
        _.map(results, 'id').includes(entity._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should return a local work', done => {
    const label = randomString(5)
    createWork({ labels: { fr: label } })
    // Let the time for Elastic Search indexation
    .then(Wait(4000))
    .then(entity => {
      return search('works', label)
      .then(results => {
        results.should.be.an.Array()
        results.forEach(result => result.type.should.equal('works'))
        _.map(results, 'id').includes(entity._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should return a wikidata work', done => {
    search('works', 'Les Misérables')
    .then(results => {
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('works'))
      _.map(results, 'id').includes('Q180736').should.be.true()
      done()
    })
    .catch(done)
  })

  it('should return a local serie', done => {
    const label = randomLabel()
    createSerie({ labels: { fr: label } })
    // Let the time for Elastic Search indexation
    .then(Wait(1000))
    .then(entity => {
      return search('series', label)
      .then(results => {
        results.should.be.an.Array()
        results.forEach(result => result.type.should.equal('series'))
        _.map(results, 'id').includes(entity._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should return a wikidata serie', done => {
    search('series', 'Harry Potter')
    .then(results => {
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('series'))
      _.map(results, 'id').includes('Q8337').should.be.true()
      done()
    })
    .catch(done)
  })

  it('should return a user', done => {
    getUser()
    .then(Wait(1000))
    .then(user => {
      return search('users', user.username)
      .then(results => {
        results.should.be.an.Array()
        results.forEach(result => result.type.should.equal('users'))
        _.map(results, 'id').includes(user._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should return a group', done => {
    const name = `group ${faker.lorem.word}`
    authReq('post', '/api/groups?action=create', { name })
    .then(Wait(1000))
    .then(group => {
      return search('groups', name)
      .then(results => {
        results.should.be.an.Array()
        results.forEach(result => result.type.should.equal('groups'))
        _.map(results, 'id').includes(group._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should not return a private group unless requester is a member', done => {
    const name = `group ${faker.lorem.word}`
    authReq('post', '/api/groups?action=create', { name, searchable: false })
    .then(Wait(1000))
    .then(group => {
      return search('groups', name)
      .then(results => {
        _.map(results, 'id').includes(group._id).should.be.false()
        // The same request but authentified with a group member account
        // should find the group
        return authReq('get', `/api/search?search=${name}&types=groups&lang=fr`)
        .then(res => {
          ({ results } = res)
          _.map(results, 'id').includes(group._id).should.be.true()
          done()
        })
      })
    })
    .catch(done)
  })

  it('should sort entities by global score', done => {
    const fullMatchLabel = randomString(15)
    const partialMatchLabel = `${fullMatchLabel} a`
    createWork({ labels: { fr: partialMatchLabel } })
    .then(work => {
      return Promise.all([
        createEditionFromWorks(work),
        createWork({ labels: { fr: fullMatchLabel } })
      ])
      // trigger a popularity refresh to avoid getting the default score on
      // the search hereafter
      .then(() => getRefreshedPopularityByUris(work.uri))
      .then(Wait(1000))
      .then(() => {
        const workWithEditionUri = work.uri
        return search('works', fullMatchLabel)
        .then(results => {
          const firstResultUri = results[0].uri
          firstResultUri.should.equal(workWithEditionUri)
          done()
        })
      })
    })
    .catch(done)
  })

  it('should return a global score boosted by a logarithmic popularity', done => {
    const workLabel = randomLabel()
    createWork({ labels: { fr: workLabel } })
    .then(work => {
      const workEditionsCreation = [
        createEditionFromWorks(work),
        createEditionFromWorks(work)
      ]
      return Promise.all(workEditionsCreation)
      // trigger a popularity refresh to avoid getting the default score on
      // the search hereafter
      .then(works => getRefreshedPopularityByUris(_.map(works, 'uri')))
      .then(Wait(2000))
      .then(() => {
        return search('works', workLabel)
        .then(results => {
          const firstEntityResult = results[0]
          const popularity = workEditionsCreation.length
          const boostLimit = firstEntityResult.lexicalScore * popularity
          firstEntityResult.globalScore.should.be.below(boostLimit)
          done()
        })
      })
    })
    .catch(done)
  })
})

const search = (types, search) => {
  search = encodeURIComponent(search)
  return nonAuthReq('get', `/api/search?search=${search}&types=${types}&lang=fr&limit=50`)
  .get('results')
}
