# Create your own instance

It is encouraged to create your own instance.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [What will you instance do](#what-will-you-instance-do)
- [Setup](#setup)
- [Tips and tricks](#tips-and-tricks)
  - [Update user role](#update-user-role)
  - [Prevent sending further emails to an email address](#prevent-sending-further-emails-to-an-email-address)
  - [Increment user undelivered emails count](#increment-user-undelivered-emails-count)
  - [Delete user account](#delete-user-account)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## What will you instance do

The federation between inventaire instances exists for one main reason: to not replicate data about books.

It would not make sense to maintain several instances of OpenStreetMap in parallel and duplicate map titles for every instances. This is why it seems crucial to Inventaire to keep data about books centralized.

This is why you may see in the configuration the term **entities host** which will refer the domain name where books data is stored. See what [entities](https://wiki.inventaire.io/wiki/Glossary#Entity) refers to.

Instance users are able to contribute to centralized books data. But to respect their privacy, their contributions are anonymized by default, and anyone may deanonymize it in their account settings.

## Setup

See [deploy](https://git.inventaire.io/inventaire-deploy) repository for a production ready setup.

See [docker](https://git.inventaire.io/docker-inventaire) repository for a Docker packaging.

## Tips and tricks

### Update user role

```sh
npm run db-actions:update-user-role <user id> <action> <role>
```

Possible actions: `add`, `remove`
Possible roles: `admin`, `dataadmin`

See: [Roles and access levels](https://wiki.inventaire.io/wiki/Roles_and_access_levels)

### Prevent sending further emails to an email address

People invited by Inventaire users might not want those emails, or some users might not know where to find email settings. To prevent sending further emails to a given address, run:

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
