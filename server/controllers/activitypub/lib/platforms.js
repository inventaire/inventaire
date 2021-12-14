const _ = require('builders/utils')

module.exports = {
  'wdt:P4033': {
    text: _.identity,
    url: address => {
      const [ username, domain ] = address.split('@')
      return `https://${domain}/@${username}`
    }
  }
}
