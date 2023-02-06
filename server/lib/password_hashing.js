import CONFIG from 'config'
import credential from 'credential'

const { useSlowPasswordHashFunction } = CONFIG

let passwordHashing

if (useSlowPasswordHashFunction) {
  passwordHashing = credential()
} else {
  // Mimicking 'credential' API, should only be used in test environment
  passwordHashing = {
    hash: async password => fastHash(password),
    verify: async (hash, password) => hash === fastHash(password),
    // In this mode, tokens never expire
    expired: () => false,
  }
}

export default passwordHashing

const fastHash = str => Buffer.from(str).toString('hex')
