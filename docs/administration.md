# Administration
Tips and scripts to administrate an instance

## Users
### Make user admin
An admin user as additional right, such as merging or deleting entities via the API
```sh
npm run db-actions:make-user-admin <user id>
```

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
