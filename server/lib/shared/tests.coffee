module.exports = (regex_, _)->
  isCouchUuid = regex_.CouchUuid.test.bind regex_.CouchUuid

  bindedTest = (regexName)-> regex_[regexName].test.bind regex_[regexName]

  tests =
    isUrl: bindedTest 'Url'
    isIpfsPath: bindedTest 'IpfsPath'
    isLocalImg: bindedTest 'LocalImg'
    isLang: bindedTest 'Lang'
    isInvEntityId: isCouchUuid
    isInvEntityUri: (uri)->
      unless _.isNonEmptyString uri then return false
      [ prefix, id ] = uri?.split ':'
      return prefix is 'inv' and isCouchUuid(id)
    isEmail: bindedTest 'Email'
    isUserId: isCouchUuid
    isGroupId: isCouchUuid
    isItemId: isCouchUuid
    isUsername: bindedTest 'Username'
    isEntityUri: bindedTest 'EntityUri'
    isExtendedEntityUri: (uri)->
      [ prefix, id ] = uri.split ':'
      # Accept alias URIs.
      # Ex: twitter:Bouletcorp -> wd:Q1524522
      return _.isNonEmptyString(prefix) and _.isNonEmptyString(id)
    isPropertyUri: bindedTest 'PropertyUri'
    isSimpleDay: (str)->
      isValidDate = false
      try
        # This line will throw if the date is invalid
        # Ex: '2018-03-32' or '2018-02-30'
        isoDate = (new Date(str)).toISOString()
        # Keep only the passed precision
        truncatedIsoDate = isoDate.slice(0, str.length)
        isValidDate = truncatedIsoDate is str
      catch err
        isValidDate = false

      return isValidDate and regex_.SimpleDay.test(str)

  tests.isExtendedUrl = (str)-> tests.isUrl(str) or tests.isIpfsPath(str)

  return tests
