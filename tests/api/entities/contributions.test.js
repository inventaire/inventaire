const __ = require('config').universalPath
const should = require('should')
const { adminReq, getUser, getReservedUser } = require('../utils/utils')
const { createWork } = require('../fixtures/entities')
const endpoint = '/api/entities?action=contributions'
const { wait, Wait } = __.require('lib', 'promises')

describe('entities:contributions', () => {
  it('should return contributions from all users by default', async () => {
    const user = await getUser()
    const { _id } = await createWork({ user })
    const { patches } = await adminReq('get', `${endpoint}&limit=5`)
    patches.should.be.an.Array()
    const lastPatch = patches[0]
    lastPatch._id.split(':')[0].should.equal(_id)
    lastPatch.user.should.equal(user._id)
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
      return adminReq('get', `${endpoint}&user=${_id}`)
      .then(res => {
        res.patches.should.be.an.Array()
        done()
      })
    })
    .catch(done)
  })

  it('should return a list of patches ordered by timestamp', done => {
    get2WorksAndUser()
    .then(([ workA, workB, user ]) => {
      const { _id } = user
      return adminReq('get', `${endpoint}&user=${_id}`)
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
    get2WorksAndUser()
    .then(([ workA, workB, user ]) => {
      const { _id } = user
      return adminReq('get', `${endpoint}&user=${_id}&limit=1`)
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
    .then(([ workA, workB, user ]) => {
      const { _id } = user
      return adminReq('get', `${endpoint}&user=${_id}`)
      .then(res => {
        const patchesCount = res.patches.length
        const offset = 1
        return adminReq('get', `${endpoint}&user=${_id}&offset=${offset}`)
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
    .then(([ workA, workB, user ]) => {
      const { _id } = user
      return adminReq('get', `${endpoint}&user=${_id}&limit=1`)
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
    .then(([ workA, workB, user ]) => {
      const { _id } = user
      return adminReq('get', `${endpoint}&user=${_id}&limit=1`)
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
    .then(([ work, user ]) => {
      const { _id } = user
      return adminReq('get', `${endpoint}&user=${_id}`)
      .then(res1 => {
        should(res1.total >= 1).be.true()
        return createWork()
        .then(Wait(10))
        .then(workB => {
          return adminReq('get', `${endpoint}&user=${_id}`)
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

let worksAndUserPromise
const get2WorksAndUser = () => {
  worksAndUserPromise = worksAndUserPromise || create2WorksAndGetUser()
  return worksAndUserPromise
}

const create2WorksAndGetUser = async () => {
  // Use a reserved user to avoiding having contributions messed-up by tests
  // in other test files
  const user = await getReservedUser()
  const workA = await createWork({ user })
  // Do not parallelize so that we can assume that workB creation is the last patch
  const workB = await createWork({ user })
  await wait(1000)
  return [ workA, workB, user ]
}

const getWorkId = id => id.split(':')[0]
const getPatchEntityId = patch => patch._id.split(':')[0]
