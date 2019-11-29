const should = require('should')
const { adminReq, getUser, undesiredErr, undesiredRes } = require('../utils/utils')
const { createWork } = require('../fixtures/entities')
const endpoint = '/api/entities?action=contributions'

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
    .catch(undesiredErr(done))
  })

  it('should return a list of patches ordered by timestamp', done => {
    create2WorksAndGetUser()
    .delay(1000)
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
    .catch(undesiredErr(done))
  })

  it('should take a limit parameter', done => {
    create2WorksAndGetUser()
    .delay(1000)
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
    .catch(undesiredErr(done))
  })

  it('should take an offset parameter', done => {
    create2WorksAndGetUser()
    .delay(1000)
    .spread((workA, workB, user) => {
      const { _id } = user
      adminReq('get', `${endpoint}&user=${_id}&limit=1&offset=1`)
      .then(res => {
        const { patches } = res
        patches.length.should.equal(1)
        workA._id.should.equal(patches[0]._id.split(':')[0])
        done()
      })
    })
    .catch(undesiredErr(done))
  })

  it('should return total and continue data', done => {
    create2WorksAndGetUser()
    .delay(1000)
    .spread((workA, workB, user) => {
      const { _id } = user
      adminReq('get', `${endpoint}&user=${_id}&limit=1`)
      .then(res1 => {
        res1.total.should.be.a.Number()
        should(res1.total >= 2).be.true()
        res1.continue.should.be.a.Number()
        res1.continue.should.equal(1)
        getWorkId(res1.patches[0]._id).should.equal(workB._id)
        create2WorksAndGetUser()
        .delay(1000)
        .spread((workC, workD) => {
          adminReq('get', `${endpoint}&user=${_id}&limit=3`)
          .then(res2 => {
            getWorkId(res2.patches[0]._id).should.equal(workD._id)
            getWorkId(res2.patches[1]._id).should.equal(workC._id)
            getWorkId(res2.patches[2]._id).should.equal(workB._id)
            res2.continue.should.equal(3)
            res2.total.should.equal(res1.total + 2)
            adminReq('get', `${endpoint}&user=${_id}&offset=3`)
            .then(res3 => {
              getWorkId(res3.patches[0]._id).should.equal(workA._id)
              done()
            })
          })
        })
      })
    })
    .catch(undesiredErr(done))
  })
})

const create2WorksAndGetUser = () => {
  return createWork()
  .delay(10)
  .then(workA => {
    return createWork()
    .delay(10)
    .then(workB => {
      return getUser()
      .then(user => [ workA, workB, user ])
    })
  })
}

const getWorkId = id => id.split(':')[0]
const getPatchEntityId = patch => patch._id.split(':')[0]
