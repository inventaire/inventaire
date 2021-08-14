const setCorsPolicy = (req, res, next) => {
  res.header('access-control-allow-origin', '*')
  res.header('access-control-allow-methods', '*')
  res.header('access-control-allow-headers', 'content-type')
  // Recommend browsers to not send cookies, to prevent CSRF on endpoints requiring authentification
  // by not setting access-control-allow-credentials, rather than setting it to false,
  // see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials#directives

  if (req.method === 'OPTIONS') {
    // The headers above is all preflight requests should need
    // See https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request
    res.end()
  } else {
    next()
  }
}

module.exports = { setCorsPolicy }
