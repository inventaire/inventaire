# Production documentation

It is encouraged to create your own instance.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Federation ?](#federation-)
  - [About data](#about-data)
  - [Fediverse](#fediverse)
  - [Social features on hold](#social-features-on-hold)
- [Install](#install)
- [Configure](#configure)
- [Administrate](#administrate)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Federation ?

Decentralisation and federation can mean many different things, and every software has its own understanding. This section aims at describing what and how Inventaire is implementing federation.

### About data

This is the main reason why Inventaire is becoming a federation of instances: to not replicate data about books.

It would not make sense to maintain several instances of OpenStreetMap in parallel and duplicate map titles for every instances. This is why it seems crucial to Inventaire to keep data about books centralized.

This is why you may see in the configuration the term **entities host** which will refer the domain name where books data is stored. See what [entities](https://wiki.inventaire.io/wiki/Glossary#Entity) refers to.

Instance users are able to contribute to centralized books data. But to respect their privacy, their contributions are anonymized by default, and anyone may deanonymize it in their account settings.

### Fediverse

Every instance mildly federates with the [fediverse](https://wiki.inventaire.io/wiki/Fediverse#Inventaire_and_the_Fediverse) (see how ). Note that this is still an experiment with a [handeful of features available](https://wiki.inventaire.io/wiki/Category:Fediverse).

### Social features on hold

Federating users and groups between instances is not possible yet. As focusing on data was a big share already to deal with.

## Install

See [installation]https://github.com/inventaire/inventaire/tree/main/docs/installation) folder.

See [deploy](https://git.inventaire.io/inventaire-deploy) repository for installation scripts to run inventaire in production.

See [docker](https://git.inventaire.io/docker-inventaire) repository for a Docker packaging.

## Configure

See [configuration]https://github.com/inventaire/inventaire/tree/main/docs/configuration) folder.

## Administrate

See [administration]https://github.com/inventaire/inventaire/tree/main/docs/administration) folder.
