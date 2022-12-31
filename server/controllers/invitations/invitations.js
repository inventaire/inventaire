import ActionsControllers from 'lib/actions_controllers'

export default {
  post: ActionsControllers({
    authentified: {
      'by-emails': require('./by_emails')
    }
  })
}
