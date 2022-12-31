import { pick, without } from 'lodash'
import { public as publicAttributes } from 'models/attributes/user'
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
