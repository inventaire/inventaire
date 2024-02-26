import { audit as auditIsbn } from 'isbn3'
import { isPlainObject } from 'lodash-es'
import { isEntityUri } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'
import { emit } from '#lib/radio'
import { responses_ } from '#lib/responses'
import { log, info } from '#lib/utils/logs'

export default {
  post: async (req, res) => {
    const { user, body } = req
    const { subject, message, uris, unknownUser } = body
    let { context } = body

    if (subject == null && message == null) {
      return error_.bundle(req, res, 'message is empty', 400)
    }

    if (!isPlainObject(context)) context = { sentContext: context }

    if (uris) {
      for (const uri of uris) {
        if (!isEntityUri(uri)) {
          return error_.bundle(req, res, 'invalid entity uri', 400, { uri })
        }
        const [ prefix, id ] = uri.split(':')
        if (prefix === 'isbn') context[uri] = auditIsbn(id)
      }
    }

    const automaticReport = uris != null

    if (!automaticReport || isNewAutomaticReport(subject)) {
      log({ subject, message, uris, unknownUser, context }, 'sending feedback')
      await emit('received:feedback', subject, message, user, unknownUser, uris, context)
    } else {
      info(subject, 'not re-sending automatic report')
    }

    responses_.ok(res, 201)
  },
}

const cache = {}
const isNewAutomaticReport = subject => {
  const isNew = (cache[subject] == null)
  cache[subject] = true
  return isNew
}
