import 'should'
import { createEdition } from '#fixtures/entities'
import { createGroup } from '#fixtures/groups'
import { wait } from '#lib/promises'
import config from '#server/config'
import { updateClaim } from '#tests/api/utils/entities'
import { leaveGroup, updateGroup } from '#tests/api/utils/groups'
import { importSomeImage, uploadSomeImage, localContainerHasImage } from '#tests/api/utils/images'
import { updateUser } from '#tests/api/utils/users'
import { getUser, getUserB } from '#tests/api/utils/utils'

const { upload: postUploadCheckDelay, update: postUpdateCheckDelay } = config.mediaStorage.images.checkDelays

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
      // Prevent getting a false positive test by having the image auto-remove by the post-upload check
      await wait(postUploadCheckDelay + 100)
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
    it('should auto-remove a group image when updated', async () => {
      const [
        group,
        { url, hash },
      ] = await Promise.all([
        createGroup(),
        importSomeImage({ container: 'groups' }),
      ])
      await updateGroup({ group, attribute: 'picture', value: url })
      // Prevent getting a false positive test by having the image auto-remove by the post-upload check
      await wait(postUploadCheckDelay + 100)
      localContainerHasImage({ container: 'groups', hash }).should.be.true()
      const { url: url2 } = await importSomeImage({ container: 'groups' })
      await updateGroup({ group, attribute: 'picture', value: url2 })
      await wait(postUpdateCheckDelay + 100)
      localContainerHasImage({ container: 'groups', hash }).should.be.false()
    })

    it('should not auto-remove a group image if the same image is used by another group', async () => {
      const [
        group,
        group2,
        { url, hash },
        { url: url2 },
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

    it('should auto-remove a group image when the group is deleted', async () => {
      const user = await getUser()
      const [
        group,
        { url, hash },
      ] = await Promise.all([
        createGroup({ user }),
        importSomeImage({ container: 'groups' }),
      ])
      await updateGroup({ group, user, attribute: 'picture', value: url })
      localContainerHasImage({ container: 'groups', hash }).should.be.true()
      await leaveGroup({ group, user })
      await wait(postUpdateCheckDelay + 100)
      localContainerHasImage({ container: 'groups', hash }).should.be.false()
    })
  })

  describe('entities', () => {
    it('should auto-remove an entity image', async () => {
      const { hash } = await importSomeImage({ container: 'entities' })
      const { uri } = await createEdition({ image: hash })
      const { hash: hash2 } = await importSomeImage({ container: 'entities' })
      await updateClaim({ uri, property: 'invp:P2', oldValue: hash, newValue: hash2 })
      // Prevent getting a false positive test by having the image auto-remove by the post-upload check
      await wait(Math.max(postUploadCheckDelay, postUpdateCheckDelay) + 100)
      localContainerHasImage({ container: 'entities', hash }).should.be.false()
    })

    it('should not auto-remove an entity image if the same image is used by another entity', async () => {
      const { hash } = await importSomeImage({ container: 'entities' })
      const [ { uri } ] = await Promise.all([
        createEdition({ image: hash }),
        createEdition({ image: hash }),
      ])
      const { hash: hash2 } = await importSomeImage({ container: 'entities' })
      await updateClaim({ uri, property: 'invp:P2', oldValue: hash, newValue: hash2 })
      // Prevent getting a false positive test by having the image auto-remove by the post-upload check
      await wait(Math.max(postUploadCheckDelay, postUpdateCheckDelay) + 100)
      localContainerHasImage({ container: 'entities', hash }).should.be.true()
    })
  })
})
