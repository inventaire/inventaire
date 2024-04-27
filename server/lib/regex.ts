// Keep in sync with client/lib/regex

export const AssetImg = /^\/img\/assets\/\w/
export const ColorHexCode = /^#[0-9a-f]{6}$/
export const CouchUuid = /^[0-9a-f]{32}$/
// Source https://html.spec.whatwg.org/multipage/input.html#email-state-%28type=email%29
export const Email = /^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
export const EntityImg = /^\/img\/entities\/[0-9a-f]{40}$/
export const EntityUri = /^(wd:Q\d+|inv:[0-9a-f]{32}|isbn:\w{10}(\w{3})?)$/
export const Float = /^-?[\d.]+$/
export const GroupImg = /^\/img\/groups\/[0-9a-f]{40}$/
export const ImageHash = /^[0-9a-f]{40}$/
export const Integer = /^-?\d+$/
// Accepting second level languages (like es-AR)
export const Lang = /^\w{2,3}(-\w{2})?$/
export const LocalImg = /^\/img\/(users|groups|entities)\/[0-9a-f]{40}$/
export const PatchId = /^[0-9a-f]{32}:[1-9]\d{0,3}$/
export const PositiveInteger = /^\d+$/
export const PropertyUri = /^(wdt|invp):P\d+$/
// A year can't start by a 0
export const Sha1 = /^[0-9a-f]{40}$/
export const SimpleDay = /^-?([1-9]{1}[0-9]{0,3}|0)(-\d{2})?(-\d{2})?$/
export const SignedInteger = /^-?[1-9]\d*$/
export const StrictlyPositiveInteger = /^[1-9]\d*$/
export const UserImg = /^\/img\/users\/[0-9a-f]{40}$/
// all 1 letter strings are reserved for the application
export const Username = /^[\p{Letter}\p{Number}_]{2,20}$/u
export const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
