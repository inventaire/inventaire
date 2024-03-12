import credential from 'credential'
import CONFIG from '#server/config'

const { useSlowPasswordHashFunction } = CONFIG

let passwordHashing

if (useSlowPasswordHashFunction) {
  passwordHashing = credential({
    // "As a general rule, calculating a hash should take less than one second."
    // https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
    // The 'credential' lib might be too conservative here
    // work=1 is too slow for the user (as of 2023: >3*10^6 iterations, >10s)
    work: 0.25,
  })
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
