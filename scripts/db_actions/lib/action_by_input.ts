import { LogError, Log } from '#lib/utils/logs'

export default input => action => {
  action(input)
  .then(Log('ok'))
  .catch(LogError('err'))
  .then(() => process.exit(0))
}
