import { log } from '#lib/utils/logs'

export default {
  all: (req, res, next) => {
    // log(req.headers, 'headers')

    // useful to see text/plain bodys
    if (isPlainText(req)) {
      rawBody(req, res, next)
    } else {
      // log(req.query, 'query')
      // log(req.body, 'body')
      res.json({ ok: true, method: req.method, body: req.body })
    }
  },
}

const isPlainText = req => req.headers['content-type'] === 'text/plain'

// Overpassing the bodyParser middleware
// as it handles json only
// cf http://stackoverflow.com/questions/22143105/node-js-express-express-json-and-express-urlencoded-with-form-submit
const rawBody = (req, res, next) => {
  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    log(body, 'body')
    res.send(body)
  })
}
