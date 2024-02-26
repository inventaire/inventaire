import util from 'node:util'
import { warn } from '#lib/utils/logs'

export const shouldNotBeCalled = res => {
  warn(util.inspect(res, false, null), 'undesired positive res')
  const err = new Error('function was expected not to be called')
  // Give 'shouldNotBeCalled' more chance to appear in the red text of the failing test
  err.name = err.statusCode = 'shouldNotBeCalled'
  err.body = { status_verbose: 'shouldNotBeCalled' }
  err.context = { res }
  throw err
}

export const rethrowShouldNotBeCalledErrors = err => {
  if (err.name === 'shouldNotBeCalled') throw err
}

export function makeSpy () {
  const spy = () => {
    spy.callCount++
  }
  spy.callCount = 0
  return spy
}
