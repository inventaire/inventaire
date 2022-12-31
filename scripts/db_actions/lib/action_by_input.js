import _ from 'builders/utils'

export default input => action => {
  action(input)
  .then(_.Log('ok'))
  .catch(_.Error('err'))
  .then(() => process.exit(0))
}
