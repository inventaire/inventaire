const _ = require('builders/utils')

module.exports = {
  all: (req, res, next) => {
    // _.log(req.headers, 'headers')

    // useful to see text/plain bodys
    if (isPlainText(req)) {
      rawBody(req, res, next)
    } else {
      // _.log(req.query, 'query')
      // _.log(req.body, 'body')
      res.json({ ok: true, method: req.method, body: req.body })
    }
  }
}

const isPlainText = req => req.headers['content-type'] === 'text/plain'

// Overpassing the bodyParser middleware
// as it handles json only
// cf http://stackoverflow.com/questions/22143105/node-js-express-express-json-and-express-urlencoded-with-form-submit
const rawBody = (req, res, next) => {
  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    _.log(body, 'body')
    res.send(body)
  })
}
