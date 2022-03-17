// Keep in sync with client/lib/regex

module.exports = {
  AssetImg: /^\/img\/assets\/\w/,
  ColorHexCode: /^#[0-9a-f]{6}$/,
  CouchUuid: /^[0-9a-f]{32}$/,
  // Source https://html.spec.whatwg.org/multipage/input.html#email-state-%28type=email%29
  Email: /^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  EntityImg: /^\/img\/entities\/[0-9a-f]{40}$/,
  EntityUri: /^(wd:Q\d+|inv:[0-9a-f]{32}|isbn:\w{10}(\w{3})?)$/,
  Float: /^-?[\d.]+$/,
  GroupImg: /^\/img\/groups\/[0-9a-f]{40}$/,
  ImageHash: /^[0-9a-f]{40}$/,
  Integer: /^-?\d+$/,
  // Accepting second level languages (like es-AR)
  Lang: /^\w{2}(-\w{2})?$/,
  LocalImg: /^\/img\/(users|groups|entities)\/[0-9a-f]{40}$/,
  PatchId: /^[0-9a-f]{32}:[1-9]\d{0,3}$/,
  PositiveInteger: /^\d+$/,
  PropertyUri: /^(wdt|invp):P\d+$/,
  // A year can't start by a 0
  Sha1: /^[0-9a-f]{40}$/,
  SimpleDay: /^-?([1-9]{1}[0-9]{0,3}|0)(-\d{2})?(-\d{2})?$/,
  StrictlyPositiveInteger: /^[1-9]\d*$/,
  UserImg: /^\/img\/users\/[0-9a-f]{40}$/,
  // all 1 letter strings are reserved for the application
  Username: /^[\p{Letter}\p{Number}_]{2,20}$/u,
  Uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
}
