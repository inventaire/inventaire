import { pick, without } from 'lodash-es'
import userAttributes from '#models/attributes/user'

const { public: publicAttributes } = userAttributes
// Omit snapshot as it contains private and semi priavte data
const publicAttributesStrict = without(publicAttributes, 'snapshot')

export default doc => {
  const publicUserDoc = pick(doc, publicAttributesStrict)
  publicUserDoc.type = 'user'
  if (publicUserDoc.position != null) {
    const [ lat, lon ] = publicUserDoc.position
    publicUserDoc.position = { lat, lon }
  }
  return publicUserDoc
}
