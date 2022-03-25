const { warn } = require('lib/utils/logs')
const util = require('util')

module.exports = {
  shouldNotBeCalled: res => {
    warn(util.inspect(res, false, null), 'undesired positive res')
    const err = new Error('function was expected not to be called')
    // Give 'shouldNotBeCalled' more chance to appear in the red text of the failing test
    err.name = err.statusCode = 'shouldNotBeCalled'
    err.body = { status_verbose: 'shouldNotBeCalled' }
    err.context = { res }
    throw err
  },

  rethrowShouldNotBeCalledErrors: err => {
    if (err.name === 'shouldNotBeCalled') throw err
  }
}
