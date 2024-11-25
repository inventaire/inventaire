import { actionsControllersFactory } from '#lib/actions_controllers'
import isbn from './isbn.js'
import { propertyValues, propertiesMetadata } from './properties_metadata.js'
import summaries from './summaries.js'
import wpExtract from './wp_extract.js'

export default {
  get: actionsControllersFactory({
    public: {
      'wp-extract': wpExtract,
      summaries,
      isbn,
      'property-values': propertyValues,
      properties: propertiesMetadata,
    },
  }),
}
