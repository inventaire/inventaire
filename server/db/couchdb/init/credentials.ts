import config from '#server/config'

const { username, password } = config.db

function getAuthorizationHeader (username: string, password: string) {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64')
  return `Basic ${credentials}`
}

const couchdbAuthorizationHeader = getAuthorizationHeader(username, password)

export const authorizedCouchdbHeaders = {
  authorization: couchdbAuthorizationHeader,
}
