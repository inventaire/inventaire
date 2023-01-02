import 'should'
import preventMultiAccountsCreation from '#controllers/user/lib/prevent_multi_accounts_creation'
import { wait } from '#lib/promises'
import { shouldNotBeCalled } from '../utils.js'

const errorMessage = 'an account is already in the process of being created with this username'

describe('prevent multi accounts creation', () => {
  it('should reject being called with the same username within a lock timeframe', async () => {
    preventMultiAccountsCreation('foo')
    try {
      preventMultiAccountsCreation('foo')
      shouldNotBeCalled()
    } catch (err) {
      err.message.should.equal(errorMessage)
    }
  })

  it('should reject being called with an equivalent username within a lock timeframe', async () => {
    preventMultiAccountsCreation('bar')
    try {
      preventMultiAccountsCreation('BAR')
      shouldNotBeCalled()
    } catch (err) {
      err.message.should.equal(errorMessage)
    }
  })

  it('should reject being called with an equivalent unicode username within a lock timeframe', async () => {
    preventMultiAccountsCreation('élise'.normalize('NFC'))
    try {
      preventMultiAccountsCreation('élise'.normalize('NFD'))
      shouldNotBeCalled()
    } catch (err) {
      err.message.should.equal(errorMessage)
    }
  })

  // This case will instead be handled by the availability tests
  it('should let through being called with the same username used by an account created much earlier', async () => {
    preventMultiAccountsCreation('buzz')
    await wait(600)
    preventMultiAccountsCreation('buzz')
  })
})
