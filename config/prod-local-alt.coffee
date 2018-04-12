# Used with NODE_APP_INSTANCE=alt to start an instance dedicated to
# - answering Prerender (thus getting the logs aside)
# - update handle database change hooks (based on follow)
# - sending activity reports
# - start couch2elastic4sync sub processes

module.exports =
  port: 3007
  db:
    follow:
      freeze: false
  activitySummary:
    disabled: false
    maxEmailsPerHour: 20
  debouncedEmail:
    # Let the main server handle it as its logs are archived so if if the mail
    # fails to be sent, it could be recovered
    disabled: true
  couch2elastic4sync:
    activated: true
  runJobsInQueue:
    'wd:popularity': true
