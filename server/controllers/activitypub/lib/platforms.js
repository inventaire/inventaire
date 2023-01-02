import _ from '#builders/utils'

export const platforms = {
  'wdt:P4033': {
    text: _.identity,
    url: address => {
      const [ username, domain ] = address.split('@')
      return `https://${domain}/@${username}`
    },
  },
}
