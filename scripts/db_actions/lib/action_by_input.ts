import { logErrorAndExit, logSuccessAndExit } from '#scripts/scripts_utils'

export function actionByInputFactory (input) {
  return async function (action) {
    try {
      const res = await action(input)
      logSuccessAndExit('action_by_input ok', res)
    } catch (err) {
      logErrorAndExit('action_by_input err', err)
    }
  }
}
