const __ = require('config').universalPath
const should = require('should')
const { adminReq, getUser, undesiredRes } = require('../utils/utils')
const { createWork } = require('../fixtures/entities')
const endpoint = '/api/entities?action=contributions'
const { Promise } = __.require('lib', 'promises')

describe('entities:contributions', () => {
  it('should reject without user id', done => {
    adminReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: user')
      done()
    })
    .catch(done)
  })

  it('should return an empty list of patch when user does not exist', done => {
    const id = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab'
    adminReq('get', `${endpoint}&user=${id}`)
    .then(res => {
      res.patches.should.be.an.Array()
      res.patches.length.should.equal(0)
      done()
    })
    .catch(done)
  })

  it('should return a list of patches', done => {
    getUser()
    .then(user => {
      const { _id } = user
      adminReq('get', `${endpoint}&user=${_id}`)
      .then(res => {
        res.patches.should.be.an.Array()
        done()
      })
    })
    .catch(done)
  })

  it('should return a list of patches ordered by timestamp', done => {
    worksAndUserPromise
    .spread((workA, workB, user) => {
      const { _id } = user
      adminReq('get', `${endpoint}&user=${_id}`)
      .then(res => {
        const { patches } = res
        const patchesIds = patches.map(getPatchEntityId);
        (patchesIds.includes(workB._id)).should.be.true();
        (patchesIds.includes(workA._id)).should.be.true();
        (patches[0].timestamp > patches[1].timestamp).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should take a limit parameter', done => {
    worksAndUserPromise
    .spread((workA, workB, user) => {
      const { _id } = user
      adminReq('get', `${endpoint}&user=${_id}&limit=1`)
      .then(res => {
        const { patches } = res
        patches.length.should.equal(1)
        workB._id.should.equal(patches[0]._id.split(':')[0])
        done()
      })
    })
    .catch(done)
  })

  it('should take an offset parameter', done => {
    worksAndUserPromise
    .spread((workA, workB, user) => {
      const { _id } = user
      adminReq('get', `${endpoint}&user=${_id}`)
      .then(res => {
        const patchesCount = res.patches.length
        const offset = 1
        adminReq('get', `${endpoint}&user=${_id}&offset=${offset}`)
        .then(res2 => {
          (patchesCount - offset).should.equal(res2.patches.length)
          done()
        })
      })
    })
    .catch(done)
  })

  it('should return total data', done => {
    worksAndUserPromise
    .spread((workA, workB, user) => {
      const { _id } = user
      adminReq('get', `${endpoint}&user=${_id}&limit=1`)
      .then(res1 => {
        res1.total.should.be.a.Number()
        should(res1.total >= 2).be.true()
        done()
      })
      .catch(done)
    })
  })

  it('should return continue data', done => {
    worksAndUserPromise
    .spread((workA, workB, user) => {
      const { _id } = user
      adminReq('get', `${endpoint}&user=${_id}&limit=1`)
      .then(res1 => {
        res1.continue.should.be.a.Number()
        res1.continue.should.equal(1)
        done()
      })
      .catch(done)
    })
  })

  it('should return increment contributions', done => {
    Promise.all([ createWork(), getUser() ])
    .spread((work, user) => {
      const { _id } = user
      adminReq('get', `${endpoint}&user=${_id}`)
      .then(res1 => {
        should(res1.total >= 1).be.true()
        createWork()
        .delay(10)
        .then(workB => {
          adminReq('get', `${endpoint}&user=${_id}`)
          .then(res2 => {
            getWorkId(res2.patches[0]._id).should.equal(workB._id)
            getWorkId(res2.patches[1]._id).should.equal(work._id)
            done()
          })
        })
      })
    })
    .catch(done)
  })
})

const create2WorksAndGetUser = () => {
  return Promise.all([ createWork(), createWork() ])
  .delay(10)
  .spread((workA, workB) => {
    return getUser()
    .then(user => [ workA, workB, user ])
  })
}

const worksAndUserPromise = create2WorksAndGetUser().delay(1000)

const getWorkId = id => id.split(':')[0]
const getPatchEntityId = patch => patch._id.split(':')[0]
