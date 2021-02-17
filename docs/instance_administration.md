# Instance administration
Tips and scripts to administrate an instance

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Users](#users)
  - [Update user role](#update-user-role)
  - [Prevent sending further emails to an email address](#prevent-sending-further-emails-to-an-email-address)
  - [Increment user undelivered emails count](#increment-user-undelivered-emails-count)
  - [Delete user account](#delete-user-account)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Users
### Update user role
```sh
npm run db-actions:update-user-role <user id> <action> <role>
```

Possible actions: `add`, `remove`
Possible roles: `admin`, `dataadmin`

### Prevent sending further emails to an email address
People invited by Inventaire users might not want those emails, to prevent sending further emails to a given address, run:
```sh
npm run db-actions:stop-emails-to-address <email address>
```

### Increment user undelivered emails count
Allows to take actions (typically, stop sending emails) when an email address has rejecting too many emails already
```sh
npm run db-actions:increment-user-undelivered-emails-count <email address>
```

### Delete user account
Delete a user account in the same way a user could do, namely by also cleaning up other databases:
* delete items, shelves, and notifications
* leave groups
* cancel ongoing transactions

```sh
npm run db-actions:delete-user <user id>
```

The script will ask for confirmation for any user that has shown signs of activity
