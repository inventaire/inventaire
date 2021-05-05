// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only


// Production config for the alternate server, which:
// - answers Prerender (thus getting the logs aside)
// - handles database changes hooks (based on follow)
// - sends activity reports

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
  jobs: {
    'inv:deduplicate': {
      run: true
    }
  },
  dataseed: {
    enabled: false
  }
}
