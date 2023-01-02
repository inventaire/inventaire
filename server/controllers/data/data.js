import ActionsControllers from '#lib/actions_controllers'
import isbn from './isbn.js'
import propertyValues from './property_values.js'
import summaries from './summaries.js'
import wpExtract from './wp_extract.js'

export default {
  get: ActionsControllers({
    public: {
      'wp-extract': wpExtract,
      summaries,
      isbn,
      'property-values': propertyValues,
    },
  }),
}
