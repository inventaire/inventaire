import CONFIG from 'config'

const { username } = CONFIG.db

if (typeof username !== 'string') {
  throw new Error(`bad CONFIG.db.username: ${username}`)
}

export default {
  admins: {
    names: [ username ],
  },
  members: {
    names: [ username ],
  },
}
