const should = require('should')
const { adminReq, getUser, getReservedUser } = require('../utils/utils')
const { createWork } = require('../fixtures/entities')
const endpoint = '/api/entities?action=contributions'
const { wait } = require('lib/promises')

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

  it('should return an empty list of patch when user does not exist', async () => {
    const id = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab'
    const { patches } = await adminReq('get', `${endpoint}&user=${id}`)
    patches.should.be.an.Array()
    patches.length.should.equal(0)
  })

  it('should return a list of patches', async () => {
    const { _id } = await getUser()
    const { patches } = await adminReq('get', `${endpoint}&user=${_id}`)
    patches.should.be.an.Array()
  })

  it('should return a list of patches ordered by timestamp', async () => {
    const { workA, workB, user } = await get2WorksAndUser()
    const { patches } = await adminReq('get', `${endpoint}&user=${user._id}`)
    const patchesIds = patches.map(getPatchEntityId)
    should(patchesIds.includes(workB._id)).be.true()
    should(patchesIds.includes(workA._id)).be.true()
    should(patches[0].timestamp > patches[1].timestamp).be.true()
  })

  it('should take a limit parameter', async () => {
    const { workB, user } = await get2WorksAndUser()
    const { patches } = await adminReq('get', `${endpoint}&user=${user._id}&limit=1`)
    patches.length.should.equal(1)
    workB._id.should.equal(patches[0]._id.split(':')[0])
  })

  it('should take an offset parameter', async () => {
    const { user } = await get2WorksAndUser()
    const { patches } = await adminReq('get', `${endpoint}&user=${user._id}`)
    const offset = 1
    const { patches: patches2 } = await adminReq('get', `${endpoint}&user=${user._id}&offset=${offset}`)
    should(patches.length - offset).equal(patches2.length)
  })

  it('should return total data', async () => {
    const { user } = await get2WorksAndUser()
    const { total } = await adminReq('get', `${endpoint}&user=${user._id}&limit=1`)
    total.should.be.a.Number()
    should(total >= 2).be.true()
  })

  it('should return continue data', async () => {
    const { user } = await get2WorksAndUser()
    const { continue: continu } = await adminReq('get', `${endpoint}&user=${user._id}&limit=1`)
    continu.should.be.a.Number()
    continu.should.equal(1)
  })

  it('should return increment contributions', async () => {
    const [ work, user ] = await Promise.all([ createWork(), getUser() ])
    const { total } = await adminReq('get', `${endpoint}&user=${user._id}`)
    should(total >= 1).be.true()
    const workB = await createWork()
    await wait(10)
    const { patches: patches2 } = await adminReq('get', `${endpoint}&user=${user._id}`)
    getWorkId(patches2[0]._id).should.equal(workB._id)
    getWorkId(patches2[1]._id).should.equal(work._id)
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
  return { workA, workB, user }
}

const getWorkId = id => id.split(':')[0]
const getPatchEntityId = patch => patch._id.split(':')[0]
