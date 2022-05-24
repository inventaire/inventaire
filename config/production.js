// Production config
// This config file will be used if: NODE_ENV=production
// Override locally in ./local-production.js

module.exports = {
  env: 'production',
  verbose: true,
  publicHostname: 'OVERRIDE',
  publicProtocol: 'https',
  getPublicOrigin: function () {
    return `${this.publicProtocol}://${this.publicHostname}`
  },
  // Let Nginx serve the static files
  // https://github.com/inventaire/inventaire-deploy/blob/master/nginx/inventaire.original.nginx
  serveStaticFiles: false,
  db: {
    username: 'OVERRIDE',
    password: 'OVERRIDE',
    suffix: 'prod',
  },
  autofixI18n: false,
  mailer: {
    disabled: false,
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
