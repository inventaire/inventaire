require('should')
const { getUserB } = require('../utils/utils')
const { wait } = require('lib/promises')
const { uploadSomeImage, localContainerHasImage } = require('../utils/images')
const { updateUser } = require('../utils/users')
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
})
