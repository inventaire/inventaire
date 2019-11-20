
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const radio = __.require('lib', 'radio')

module.exports = {
  post: (req, res, next) => {
    const { user } = req
    const { subject, message, uris, context, unknownUser } = req.body

    if ((subject == null) && (message == null)) {
      return error_.bundle(req, res, 'message is empty', 400)
    }

    if (uris != null) {
      for (const uri of uris) {
        if (!_.isEntityUri(uri)) {
          return error_.bundle(req, res, 'invalid entity uri', 400, { uri })
        }
      }
    }

    const automaticReport = (uris != null)

    if (!automaticReport || isNewAutomaticReport(subject)) {
      _.log({ subject, message, uris, unknownUser, context }, 'sending feedback')
      radio.emit('received:feedback', subject, message, user, unknownUser, uris, context)
    } else {
      _.info(subject, 'not re-sending automatic report')
    }

    return responses_.ok(res, 201)
  }
}

const cache = {}
const isNewAutomaticReport = subject => {
  const isNew = (cache[subject] == null)
  cache[subject] = true
  return isNew
}
