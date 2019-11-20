// Use by setting NODE_ENV=dev
// Will be overriden by local.js

module.exports = {
  env: 'dev',
  dataseed: {
    enabled: true
  },
  entitiesSearchEngine: {
    delay: 5000
  },
  db: {
    enableDesignDocSync: true
  }
}
