# Swift media storage and management

The easiest way to manage the images stored in OpenStack Swift containers is to use the [official CLI client](https://docs.openstack.org/python-swiftclient/latest/cli/index.html). On Debian-based systems, it can be installed with the following command:
```sh
sudo apt-get install python3-swiftclient -y
```

Get authentification environment variables from your OpenStack Swift provider:
* [OVH](https://docs.ovh.com/us/en/public-cloud/set-openstack-environment-variables/)

```sh
# Load the environment from the config file
source ./openrc_ovh.sh

# List containers in the ENV REGIONS
swift list

# Create a container with the content of the current folder
swift upload testcontainer .

# Make that new container public
swift post --read-acl '.r:*,.rlistings' testcontainer
```
