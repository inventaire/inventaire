# Use NODE_APP_INSTANCE=tests to override local config with local-tests config

module.exports =
  dataseed:
    enabled: false
  mailer:
    enabled: false
  # Use a real leveldown to ease debug with lev
  leveldbMemoryBackend: false
