import config from '#server/config'

const { username } = config.db

if (typeof username !== 'string') {
  throw new Error(`bad config.db.username: ${username}`)
}

export default {
  admins: {
    names: [ username ],
  },
  members: {
    names: [ username ],
  },
}
