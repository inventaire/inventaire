require('should')
const { getUserB } = require('../utils/utils')
const { wait } = require('lib/promises')
const { importSomeImage, uploadSomeImage, localContainerHasImage } = require('../utils/images')
const { updateUser } = require('../utils/users')
const { createGroup } = require('../fixtures/groups')
const { updateGroup } = require('../utils/groups')
const { createEdition } = require('../fixtures/entities')
const { updateClaim } = require('../utils/entities')
const { upload: postUploadCheckDelay, update: postUpdateCheckDelay } = require('config').mediaStorage.images.checkDelays

describe('images:auto-remove', () => {
  describe('upload', () => {
    it('should auto-remove an image not used after a delay', async () => {
      const { url } = await uploadSomeImage({ container: 'users' })
      await wait(postUploadCheckDelay + 100)
      localContainerHasImage({ url }).should.be.false()
    })
  })

  describe('convert-url', () => {
    it('should auto-remove an image not used after a delay', async () => {
      const { url } = await importSomeImage({ container: 'groups' })
      await wait(postUploadCheckDelay + 100)
      localContainerHasImage({ url }).should.be.false()
    })
  })

  describe('users', () => {
    it('should auto-remove a user image', async () => {
      const { url, hash } = await importSomeImage({ container: 'users' })
      await updateUser({ attribute: 'picture', value: url })
      const { url: url2 } = await importSomeImage({ container: 'users' })
      await updateUser({ attribute: 'picture', value: url2 })
      await wait(postUpdateCheckDelay + 100)
      localContainerHasImage({ container: 'users', hash }).should.be.false()
    })

    it('should not auto-remove a user image if the same image is used by another user', async () => {
      const { url, hash } = await importSomeImage({ container: 'users' })
      await Promise.all([
        updateUser({ attribute: 'picture', value: url }),
        updateUser({ attribute: 'picture', value: url, user: getUserB() }),
      ])
      const { url: url2 } = await importSomeImage({ container: 'users' })
      await updateUser({ attribute: 'picture', value: url2 })
      await wait(postUpdateCheckDelay + 100)
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
      await updateGroup({ group, attribute: 'picture', value: url })
      await updateGroup({ group, attribute: 'picture', value: url2 })
      await wait(postUpdateCheckDelay + 100)
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
      await wait(postUpdateCheckDelay + 100)
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
      const { uri } = await createEdition({ image: hash })
      await wait(1000)
      await updateClaim({ uri, property: 'invp:P2', oldValue: hash, newValue: hash2 })
      await wait(postUpdateCheckDelay + 100)
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
      await updateClaim({ uri, property: 'invp:P2', oldValue: hash, newValue: hash2 })
      await wait(postUpdateCheckDelay + 100)
      localContainerHasImage({ container: 'entities', hash }).should.be.true()
    })
  })
})
