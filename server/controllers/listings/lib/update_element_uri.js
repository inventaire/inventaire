import { bulkUpdateElements, getElementsByEntities } from '#controllers/listings/lib/elements'
import { assert_ } from '#lib/utils/assert_types'

export async function updateElementsUris (currentUri, newUri) {
  const oldElements = await getElementsByEntities([ currentUri ])
  await bulkUpdateElements({
    oldElements,
    attribute: 'uri',
    value: newUri,
  })
}

const toPropagate = [
  [ 'inv:083c773e8b26776230e40657fdec75bf', 'wd:Q116286159' ],
  [ 'inv:08b42c3bb8fc7a30912cbb535eaa1098', 'wd:Q116957903' ],
  [ 'inv:263e35bbad8e4b65dabf466267dd3b31', 'inv:a00e30111375efb9ce360805c08193f5' ],
  [ 'inv:320d4c7c453886081a4da182e36ba606', 'wd:Q117871679' ],
  [ 'inv:37f13070a75efd265deecab5e2feca25', 'wd:Q118435706' ],
  [ 'inv:4365767641e8355bae862c755e55c044', 'wd:Q114444669' ],
  [ 'inv:633835fc12ba489cdb202d0d63ec1716', 'inv:a4f614c3e66cd569b87aeb037745bf21' ],
  [ 'inv:68088f95a3449457b59447af8c5ddafa', 'inv:68088f95a3449457b59447af8c5dc34b' ],
  [ 'inv:b783fb2ed94e3267444fc38708cbc146', 'wd:Q101084699' ],
  [ 'inv:b8313f633c3b6c6218481e4510080037', 'wd:Q120240807' ],
  [ 'inv:bf57f73d2b089f44525d0d18228bdfe9', 'wd:Q115196135' ],
  [ 'inv:e94ed47d24e967b3a7e41e7e95292cb8', 'wd:Q16681364' ],
  [ 'inv:fd9bae971f7762be2f0b8f2da2a48ea2', 'wd:Q117842435' ],
]

async function sequentialPropagate () {
  const next = toPropagate.pop()
  if (!next) return
  console.log('🚀 ~ file: update_element_uri.js ~ line', 32, 'sequentialPropagate ~ ', { next })
  const [ currentUri, newUri ] = next
  assert_.string(currentUri)
  assert_.string(newUri)
  await updateElementsUris(currentUri, newUri)
  await sequentialPropagate()
}

sequentialPropagate()
.catch(console.error)
