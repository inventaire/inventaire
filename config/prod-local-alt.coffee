# Used with NODE_APP_INSTANCE=alt to start an instance dedicated to
# - answering Prerender (thus getting the logs aside)
# - update handle database change hooks (based on follow)
# - sending activity reports
# - sending debounced emails
# - start couch2elastic4sync sub processes

module.exports =
  port: 3007
  db:
    follow:
      freeze: false
  activitySummary:
    disabled: false
  debouncedEmail:
    disabled: false
  couch2elastic4sync:
    activated: true
