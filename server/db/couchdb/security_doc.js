const { username } = require('config').db
if (typeof username !== 'string') {
  throw new Error(`bad CONFIG.db.username: ${username}`)
}

module.exports = {
  admins: {
    names: [ username ]
  },
  members: {
    names: [ username ]
  }
}
