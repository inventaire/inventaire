import { identity } from 'lodash-es'

export const platforms = {
  'wdt:P4033': {
    text: identity,
    url: address => {
      const [ username, domain ] = address.split('@')
      return `https://${domain}/@${username}`
    },
  },
}
