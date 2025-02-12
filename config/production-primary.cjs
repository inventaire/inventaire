// Primary production server config, to be used in combinaison with the alt server (see ./production-alt.cjs)

// This config file will be used if: NODE_ENV=production NODE_APP_INSTANCE=primary
// Override locally in ./local-production-primary.cjs

/** @typedef { import('../types/types.ts').Config } Config */
/** @typedef { import('type-fest').PartialDeep } PartialDeep */

/** @type {PartialDeep<Config>} */
const config = {
  db: {
    follow: {
      freeze: true,
    },
  },
  activitySummary: {
    disabled: true,
  },
  // Let the alt instance run the jobs
  jobs: {
    'inv:deduplicate': {
      run: false,
    },
    'entity:popularity': {
      run: false,
    },
    'wd:entity:indexation': {
      run: false,
    },
    'post:activity': {
      run: false,
    },
  },
}

module.exports = config
