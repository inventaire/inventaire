# adapted from http://stackoverflow.com/a/14582229/3324977
urlPattern = '^(https?:\\/\\/)'+ # protocol
  '(\\w+:\\w+@)?'+ # auth?
  '((([a-z\\d]([a-z\\d-_]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ # domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))|'+ # OR ip (v4) address
  '(localhost)'+ # OR localhost
  '(\\:\\d+)?' + # port?
  '(\\/[-a-z\\d%_.~+]*)*'+ # path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ # query string?
  '(\\#[-a-z\\d_]*)?$' #fragment?

module.exports =
  Url: new RegExp urlPattern , 'i'
  IpfsPath: /\/ipfs\/\w{46}/
  # minimanlist email regex
  # cf http://davidcel.is/blog/2012/09/06/stop-validating-email-addresses-with-regex/
  Email: /.+@.+\..+/i
  Uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
  CouchUuid: /^[0-9a-f]{32}$/
  Lang: /^\w{2}$/
  LocalImg: /^\/img\/[0-9a-f]{40}.jpg$/
  # all 1 letter strings are reserved for the application
  Username: /^\w{2,20}$/
  EntityUri: /^(wd:Q\d+|inv:[0-9a-f]{32}|isbn:\w{10}(\w{3})?)$/
  PropertyUri: /^(wdt|invp):P\d+$/
  # A year can't start by a 0
  SimpleDay: /^-?([1-9]{1}[0-9]{0,3}|0)(-\d{2})?(-\d{2})?$/
