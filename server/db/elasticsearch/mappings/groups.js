import { boolean, geoPoint, text } from './mappings_datatypes.js'

export default {
  properties: {
    name: text,
    description: text,
    searchable: boolean,
    position: geoPoint,
  },
}
