// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const CONFIG = require('config')

module.exports = (function () {
  let securityDoc
  const {
    username
  } = CONFIG.db
  if (typeof username !== 'string') {
    throw new Error(`bad CONFIG.db.username: ${username}`)
  }

  return securityDoc = {
    admins: {
      names: [ username ]
    },
    members: {
      names: [ username ]
    }
  }
})()
