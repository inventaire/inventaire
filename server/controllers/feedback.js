const __ = require('config').universalPath
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const radio = require('lib/radio')
const { audit: auditIsbn } = require('isbn3')

module.exports = {
  post: (req, res) => {
    const { user, body } = req
    const { subject, message, uris, unknownUser } = body
    let { context } = body

    if (subject == null && message == null) {
      return error_.bundle(req, res, 'message is empty', 400)
    }

    if (!_.isPlainObject(context)) context = { sentContext: context }

    if (uris) {
      for (const uri of uris) {
        if (!_.isEntityUri(uri)) {
          return error_.bundle(req, res, 'invalid entity uri', 400, { uri })
        }
        const [ prefix, id ] = uri.split(':')
        if (prefix === 'isbn') context[uri] = auditIsbn(id)
      }
    }

    const automaticReport = uris != null

    if (!automaticReport || isNewAutomaticReport(subject)) {
      _.log({ subject, message, uris, unknownUser, context }, 'sending feedback')
      radio.emit('received:feedback', subject, message, user, unknownUser, uris, context)
    } else {
      _.info(subject, 'not re-sending automatic report')
    }

    responses_.ok(res, 201)
  }
}

const cache = {}
const isNewAutomaticReport = subject => {
  const isNew = (cache[subject] == null)
  cache[subject] = true
  return isNew
}
