require('should')
const { getUserB } = require('../utils/utils')
const { wait } = require('lib/promises')
const { uploadSomeImage, localContainerHasImage } = require('../utils/images')
const { updateUser } = require('../utils/users')
const { createGroup } = require('../fixtures/groups')
const { updateGroup } = require('../utils/groups')
const { checkDelay } = require('config').mediaStorage.images
const delay = checkDelay + 100

describe('images:auto-remove', () => {
  describe('users', () => {
    it('should auto-remove a user image', async () => {
      const { url, hash } = await uploadSomeImage({ container: 'users' })
      localContainerHasImage({ container: 'users', hash }).should.be.true()
      await updateUser({ attribute: 'picture', value: url })
      const { url: url2, hash: hash2 } = await uploadSomeImage({ container: 'users' })
      localContainerHasImage({ container: 'users', hash: hash2 }).should.be.true()
      await updateUser({ attribute: 'picture', value: url2 })
      await wait(delay)
      localContainerHasImage({ container: 'users', hash }).should.be.false()
    })

    it('should not auto-remove a user image if the same image is used by another user', async () => {
      const { url, hash } = await uploadSomeImage({ container: 'users' })
      await Promise.all([
        updateUser({ attribute: 'picture', value: url }),
        updateUser({ attribute: 'picture', value: url, user: getUserB() }),
      ])
      const { url: url2, hash: hash2 } = await uploadSomeImage({ container: 'users' })
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
        uploadSomeImage({ container: 'groups' }),
        uploadSomeImage({ container: 'groups' }),
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
        uploadSomeImage({ container: 'groups' }),
        uploadSomeImage({ container: 'groups' }),
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
})
