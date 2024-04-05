import { LogError, Log } from '#lib/utils/logs'

export default input => action => {
  action(input)
  .then(Log('action_by_input ok'))
  .catch(LogError('action_by_input err'))
  .then(() => process.exit(0))
}
