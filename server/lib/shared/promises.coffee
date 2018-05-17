module.exports = (Promise)->
  # Used has a way to create only one resolved promise to start promise chains.
  # Unfortunatly, this object can't be froozen as it would be incompatible with
  # bluebird cancellable promises.
  # This may register as a premature micro-optimization
  # cf http://stackoverflow.com/q/40683818/3324977
  resolved = Promise.resolve()

  return API =
    resolve: Promise.resolve
    reject: Promise.reject
    resolved: resolved

    # start a promise chain after a delay
    delay: resolved.delay
    try: Promise.try
