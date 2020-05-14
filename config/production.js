// Production config
// This config file will be used if: NODE_ENV=production
// Override locally in ./local-production.js

module.exports = {
  env: 'production',
  verbose: true,
  publicHost: 'OVERRIDE',
  publicProtocol: 'https',
  fullPublicHost: function () {
    return `${this.publicProtocol}://${this.publicHost}`
  },
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
