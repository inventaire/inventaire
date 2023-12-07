import allowedValuesPerTypePerProperty from '#controllers/entities/lib/properties/allowed_values_per_type_per_property'
import { sendStaticJson } from '#lib/responses'

const stringifiedValues = JSON.stringify({ values: allowedValuesPerTypePerProperty })

export default (req, res) => sendStaticJson(res, stringifiedValues)
