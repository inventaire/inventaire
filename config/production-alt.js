// Production config for the alternate server, which:
// - answering Prerender (thus getting the logs aside)
// - update handle database change hooks (based on follow)
// - sending activity reports
// - start couch2elastic4sync sub processes

// This config file will be used if: NODE_ENV=production NODE_APP_INSTANCE=alt
// Override locally in ./local-production-alt.js

module.exports = {
  port: 3007,
  db: {
    follow: {
      freeze: false
    }
  },
  activitySummary: {
    disabled: false,
    maxEmailsPerHour: 20
  },
  debouncedEmail: {
    // Let the main server handle it as its logs are archived so if if the mail
    // fails to be sent, it could be recovered
    disabled: true
  },
  couch2elastic4sync: {
    activated: true
  },
  jobs: {
    'inv:deduplicate': {
      run: true
    }
  },
  dataseed: {
    enabled: false
  }
}
