module.exports =
  env: 'production'
  verbosity: 2
  publicHost: 'OVERRIDE'
  publicProtocol: 'https'
  fullPublicHost: -> "#{@publicProtocol}://#{@publicHost}"
  secret: "OVERRIDE"
  # Let Nginx serve the static files
  # https://github.com/inventaire/inventaire-deploy/blob/master/nginx/inventaire.original.nginx
  serveStaticFiles: false
  db:
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
  logMissingI18nKeys: false
  mailer:
    disabled: false
    preview: false
  activitySummary:
    disabled: false
  elasticsearch:
    # Progressive contributor setup: allow to start without installing ElasticSearch
    enabled: true
