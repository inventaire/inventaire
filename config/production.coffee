module.exports =
  env: 'production'
  verbosity: 2
  publicHost: 'OVERRIDE'
  publicProtocol: 'https'
  fullPublicHost: -> "#{@publicProtocol}://#{@publicHost}"
  secret: "OVERRIDE"
  db:
    instable: false
    reloadDesignDocs: false
    username: 'OVERRIDE'
    password: 'OVERRIDE'
  noCache: true
  staticMaxAge: 0
  aws:
    key: 'OVERRIDE'
    secret: 'OVERRIDE'
    region: 'OVERRIDE'
    bucket: 'OVERRIDE'
  https:
    key: '/cert/OVERRIDE.key'
    cert: '/cert/OVERRIDE.crt'
  typeCheck: false
  promisesStackTrace: false
  morganLogFormat: 'short'
  sendServerErrorsClientSide: true
  logMissingI18nKeys: false
  serveStatic: false
