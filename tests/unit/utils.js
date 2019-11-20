
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { warn } = require('inv-loggers')
const util = require('util')

module.exports = {
  // A function to quickly fail when a test gets an undesired positive answer
  undesiredRes: done => {
    return res => {
      done(new Error('.then function was expected not to be called'))
      return warn(util.inspect(res, false, null), 'undesired positive res')
    }
  },

  undesiredErr: done => {
    return err => {
      done(err)
      return warn(err.body || err, 'undesired err body')
    }
  }
}
