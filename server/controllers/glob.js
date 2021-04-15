const __ = require('config').universalPath
const error_ = require('lib/error/error')
const publicFolder = __.path('client', 'public')
const indexOptions = {
  root: publicFolder,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  }
}

module.exports = {
  get: (req, res) => {
    const { pathname } = req._parsedUrl
    const domain = pathname.split('/')[1]
    if (domain === 'api') {
      error_.bundle(req, res, `GET ${pathname}: api route not found`, 404)
    } else if (domain === 'public') {
      error_.bundle(req, res, `GET ${pathname}: asset not found`, 404)
    } else if (imageHeader(req)) {
      const err = `GET ${pathname}: wrong content-type: ${req.headers.accept}`
      error_.bundle(req, res, err, 400)
    } else {
      // the routing will be done on the client side
      res.sendFile('./index.html', indexOptions)
    }
  },

  redirectToApiDoc: (req, res) => res.redirect('https://api.inventaire.io'),

  api: (req, res) => {
    error_.bundle(req, res, 'wrong API route or http verb', 404, {
      verb: req.method,
      url: req._parsedUrl.href
    })
  }
}

const imageHeader = req => /^image/.test(req.headers.accept)
