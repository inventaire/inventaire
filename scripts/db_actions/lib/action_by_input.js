const _ = require('builders/utils')

module.exports = input => action => {
  action(input)
  .then(_.Log('ok'))
  .catch(_.Error('err'))
  .then(() => process.exit(0))
}
