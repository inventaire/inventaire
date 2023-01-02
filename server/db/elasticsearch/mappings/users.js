import { geoPoint, text } from './mappings_datatypes.js'

export default {
  properties: {
    username: text,
    bio: text,
    position: geoPoint,
  }
}
