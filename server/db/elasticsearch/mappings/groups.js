import { boolean, geoPoint, text } from './mappings_datatypes'

export default {
  properties: {
    name: text,
    description: text,
    searchable: boolean,
    position: geoPoint,
  }
}
