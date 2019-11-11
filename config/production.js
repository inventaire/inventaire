// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
module.exports = {
  env: 'production',
  verbosity: 2,
  publicHost: 'OVERRIDE',
  publicProtocol: 'https',
  fullPublicHost() { return `${this.publicProtocol}://${this.publicHost}` },
  secret: 'OVERRIDE',
  // Let Nginx serve the static files
  // https://github.com/inventaire/inventaire-deploy/blob/master/nginx/inventaire.original.nginx
  serveStaticFiles: false,
  db: {
    username: 'OVERRIDE',
    password: 'OVERRIDE'
  },
  noCache: true,
  staticMaxAge: 0,
  bluebird: {
    warnings: false,
    longStackTraces: false
  },
  logMissingI18nKeys: false,
  mailer: {
    disabled: false,
    preview: false
  },
  activitySummary: {
    disabled: false
  },
  // Let the alt instance run the jobs
  jobs: {
    'inv:deduplicate': {
      run: false
    }
  }
}
