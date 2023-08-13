import should from 'should'
import { wait } from '#lib/promises'
import { customAuthReq } from '#tests/api/utils/request'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { createWork } from '../fixtures/entities.js'
import { updateClaim, updateLabel } from '../utils/entities.js'
import {
  adminReq,
  getUser,
  getReservedUser,
  authReq,
  getDeanonymizedUser,
} from '../utils/utils.js'

const endpoint = '/api/entities?action=contributions'

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

  describe('filter', () => {
    it('should filter by claim property', async () => {
      const user = await getReservedUser()
      const { uri } = await createWork({ user })
      const property = 'wdt:P921'
      await updateClaim({ uri, property, newValue: 'wd:Q1', user })
      await updateClaim({ uri, property: 'wdt:P136', newValue: 'wd:Q2', user })
      await updateClaim({ uri, property, newValue: 'wd:Q3', user })
      await updateClaim({ uri, property, oldValue: 'wd:Q1', user })
      const { patches, total } = await adminReq('get', `${endpoint}&user=${user._id}&filter=${property}`)
      patches.length.should.equal(3)
      total.should.equal(3)
      patches.forEach(({ patch }) => {
        patch.some(operation => operation.path.includes(`/${property}`)).should.be.true()
      })
    })

    it('should filter by label lang', async () => {
      const user = await getReservedUser()
      const { uri } = await createWork({ user })
      const lang = 'ca'
      await updateLabel({ uri, lang, value: 'foo', user })
      await updateLabel({ uri, lang: 'it', value: 'bar', user })
      await updateLabel({ uri, lang, value: 'buzz', user })
      const { patches, total } = await adminReq('get', `${endpoint}&user=${user._id}&filter=${lang}`)
      patches.length.should.equal(2)
      total.should.equal(2)
      patches.forEach(({ patch }) => {
        patch.some(operation => operation.path.includes(`/${lang}`)).should.be.true()
      })
    })
  })

  describe('non-admin access level', () => {
    it('should reject requests for private contributions from another user', async () => {
      const { user } = await get2WorksAndUser()
      await authReq('get', `${endpoint}&user=${user._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })

    it('should accept requests for private contributions from the user themselves', async () => {
      const { user } = await get2WorksAndUser()
      const { patches } = await customAuthReq(user, 'get', `${endpoint}&user=${user._id}`)
      patches.should.be.an.Array()
    })

    it('should accept requests for public contributions', async () => {
      const deanonymizedUser = await getDeanonymizedUser()
      const { patches } = await authReq('get', `${endpoint}&user=${deanonymizedUser._id}`)
      patches.should.be.an.Array()
    })

    it('should get anonymized contributions', async () => {
      const { workA, workB } = await get2WorksAndUser()
      const deanonymizedUser = await getDeanonymizedUser()
      const workC = await createWork({ user: deanonymizedUser })
      const { patches } = await authReq('get', endpoint)
      should(patches.find(isEntityPatch(workA)).user).not.be.ok()
      should(patches.find(isEntityPatch(workB)).user).not.be.ok()
      patches.find(isEntityPatch(workC)).user.should.equal(deanonymizedUser._id)
    })

    it('should not anonymize contributions when the patch author is the requesting user', async () => {
      const user = await getReservedUser()
      const { _id: workId } = await createWork({ user })
      const { patches } = await customAuthReq(user, 'get', `${endpoint}&limit=1`)
      patches[0]._id.should.startWith(workId)
      patches[0].user.should.equal(user._id)
    })
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
  await wait(100)
  return { workA, workB, user }
}

const getWorkId = id => id.split(':')[0]
const getPatchEntityId = patch => patch._id.split(':')[0]
const isEntityPatch = entity => patch => patch._id.split(':')[0] === entity._id
