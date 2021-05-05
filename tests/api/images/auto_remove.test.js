require('should')
const { getUserB } = require('../utils/utils')
const { wait } = require('lib/promises')
const { importSomeImage, localContainerHasImage } = require('../utils/images')
const { updateUser } = require('../utils/users')
const { createGroup } = require('../fixtures/groups')
const { updateGroup } = require('../utils/groups')
const { checkDelay } = require('config').mediaStorage.images
const { createEdition } = require('../fixtures/entities')
const { updateClaim } = require('../utils/entities')
const delay = checkDelay + 100

describe('images:auto-remove', () => {
  describe('users', () => {
    it('should auto-remove a user image', async () => {
      const { url, hash } = await importSomeImage({ container: 'users' })
      localContainerHasImage({ container: 'users', hash }).should.be.true()
      await updateUser({ attribute: 'picture', value: url })
      const { url: url2, hash: hash2 } = await importSomeImage({ container: 'users' })
      localContainerHasImage({ container: 'users', hash: hash2 }).should.be.true()
      await updateUser({ attribute: 'picture', value: url2 })
      await wait(delay)
      localContainerHasImage({ container: 'users', hash }).should.be.false()
    })

    it('should not auto-remove a user image if the same image is used by another user', async () => {
      const { url, hash } = await importSomeImage({ container: 'users' })
      await Promise.all([
        updateUser({ attribute: 'picture', value: url }),
        updateUser({ attribute: 'picture', value: url, user: getUserB() }),
      ])
      const { url: url2, hash: hash2 } = await importSomeImage({ container: 'users' })
      localContainerHasImage({ container: 'users', hash: hash2 }).should.be.true()
      await updateUser({ attribute: 'picture', value: url2 })
      await wait(delay)
      localContainerHasImage({ container: 'users', hash }).should.be.true()
    })
  })

  describe('groups', () => {
    it('should auto-remove a group image', async () => {
      const [
        group,
        { url, hash },
        { url: url2 }
      ] = await Promise.all([
        createGroup(),
        importSomeImage({ container: 'groups' }),
        importSomeImage({ container: 'groups' }),
      ])
      localContainerHasImage({ container: 'groups', hash }).should.be.true()
      await updateGroup({ group, attribute: 'picture', value: url })
      await updateGroup({ group, attribute: 'picture', value: url2 })
      await wait(delay)
      localContainerHasImage({ container: 'groups', hash }).should.be.false()
    })

    it('should not auto-remove a group image if the same image is used by another group', async () => {
      const [
        group,
        group2,
        { url, hash },
        { url: url2 }
      ] = await Promise.all([
        createGroup(),
        createGroup(),
        importSomeImage({ container: 'groups' }),
        importSomeImage({ container: 'groups' }),
      ])
      await Promise.all([
        updateGroup({ group, attribute: 'picture', value: url }),
        updateGroup({ group: group2, attribute: 'picture', value: url }),
      ])
      await updateGroup({ group, attribute: 'picture', value: url2 })
      await wait(delay)
      localContainerHasImage({ container: 'groups', hash }).should.be.true()
    })
  })

  describe('entities', () => {
    it('should auto-remove an entity image', async () => {
      const [
        { hash },
        { hash: hash2 },
      ] = await Promise.all([
        importSomeImage({ container: 'entities' }),
        importSomeImage({ container: 'entities' }),
      ])
      localContainerHasImage({ container: 'entities', hash }).should.be.true()
      const { uri } = await createEdition({ image: hash })
      await wait(1000)
      await updateClaim(uri, 'invp:P2', hash, hash2)
      await wait(delay)
      localContainerHasImage({ container: 'entities', hash }).should.be.false()
    })

    it('should not auto-remove an entity image if the same image is used by another entity', async () => {
      const [
        { hash },
        { hash: hash2 },
      ] = await Promise.all([
        importSomeImage({ container: 'entities' }),
        importSomeImage({ container: 'entities' }),
      ])
      const [ { uri } ] = await Promise.all([
        createEdition({ image: hash }),
        createEdition({ image: hash }),
      ])
      await wait(1000)
      await updateClaim(uri, 'invp:P2', hash, hash2)
      await wait(delay)
      localContainerHasImage({ container: 'entities', hash }).should.be.true()
    })
  })
})
