module.exports =
  env: 'production'
  verbosity: 2
  publicHost: 'OVERRIDE'
  publicProtocol: 'https'
  fullPublicHost: -> "#{@publicProtocol}://#{@publicHost}"
  secret: "OVERRIDE"
  # Let Nginx serve the static files
  # https://github.com/inventaire/inventaire-deploy/blob/master/nginx/inventaire.original.nginx
  serverStaticFiles: false
  db:
    unstable: false
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
  typeCheck: false
  bluebird:
    warnings: false
    longStackTraces: false
  morgan:
    logFormat: 'short'
  sendServerErrorsClientSide: true
  logMissingI18nKeys: false
  serveStatic: false
  mailer:
    disabled: false
    preview: false
  activitySummary:
    disabled: false
