import { geoPoint, text } from './mappings_datatypes'

export default {
  properties: {
    username: text,
    bio: text,
    position: geoPoint,
  }
}
