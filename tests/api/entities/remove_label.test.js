import should from 'should'
import { createHuman } from '#fixtures/entities'
import { getRandomString } from '#lib/utils/random_string'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { getByUri, removeLabel } from '../utils/entities.js'

describe('entities:remove-labels', () => {
  it('should remove a label', async () => {
    const value = getRandomString(15)
    const { uri } = await createHuman({
      labels: {
        en: value,
        fr: value,
      },
    })
    await removeLabel({ uri, lang: 'fr' })
    const updatedHuman = await getByUri(uri)
    should(updatedHuman.labels.fr).not.be.ok()
  })

  it('should reject removing the last label', async () => {
    const value = getRandomString(15)
    const { uri } = await createHuman({
      labels: {
        en: value,
      },
    })
    await removeLabel({ uri, lang: 'en' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('can not delete the last label')
    })
  })
})
