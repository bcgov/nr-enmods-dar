# SFTP Server

This folder holds the Helm chart for the SFTPGo server that enmods uses. Pre-approved users upload their files to this server 
and a cron job in the backend downloads those files and passes them along for processing before deleting them from the SFTP
server.

## SFTP Server Setup

First make sure you are connected to OpenShift using the ```oc login <token>``` command, then make sure you are using the correct 
project using the ```oc project <enmods-project-name>``` command (```oc projects``` lists all projects)

In this folder (nr-enmods-dar/openshift/sftpgo) run these commands:

```oc new-build . --name=sftpgo --binary```

```oc start-build sftpgo --from-dir=. --follow```

This will create a new BuildConfig and create a new Build using the Dockerfile. Next, run this command:

```helm install sftpgo .```

This will a Deployment (sftpgo), Service (sftpgo), PersistentVolumeClaim (sftpgo-pvc), and Secret (sftpgo-sftp-secrets). The Secrets will be empty and 
will need to be filled in manually.

### BuildConfig
The build config is created by the Dockerfile and entrypoint.sh. Docker uses the drakkan/sftpgo image, exposes ports 2222 and 8080, 
and then runs the entrypoint.sh file. The entrypoint.sh file creates an admin account for the SFTPGo GUI, as well as several users
and specifies their permissions. Right now entrypoint.sh is hardcoded to create users like uploader1. Eventually this will need 
to be updated with actual usernames that will be used or to environment variables drawing from secrets.

### Deployment
Allows us to create pods that use the Docker image created by BuildConfig.

### Service
Allows us to connect to the server.

### PersistentVolumeClaim
Holds the SFTPGo pod data. Currently 500Mi in size.

### Secrets
  - UPLOADER1_PUBLIC_KEY  : uploader1 rsa public key
  - UPLOADER2_PUBLIC_KEY  : uploader2 rsa public key
  - UPLOADER3_PUBLIC_KEY  : uploader3 rsa public key
  - UPLOADER1_USERNAME    : uploader1 username
  - UPLOADER2_USERNAME    : uploader2 username
  - UPLOADER3_USERNAME    : uploader3 username
  - SERVICE_PUBLIC_KEY    : backend sftp service account rsa public key
  - ADMIN_USER            : admin username for the SFTPGo GUI
  - ADMIN_PASSWORD        : admin password for the SFTPGo GUI

## Backend SFTP Module
There is a backend module called sftp that handles sftp file operations using a cron job. The sftp backend service connects to the sftp server using the package
```ssh2-sftp-client```. It connects as the service user using a private rsa key stored in the environment variables as ```SFTP_PRIVATE_KEY_BASE64```.
The service account has access to all the user folders and every 10 minutes it is used to scan each folder, download the file, and pass it on for processing.
The user folders should be named to match the username column in the sftp_users table as this is used to identify the uploader to later send them a notification.

### Notes
- User public keys & usernames are stored as secrets in OpenShift, these secrets are used by the Dockerfile + entrypoint.sh 
when creating the users in the SFTPGo server. If you adjust the names of these secrets or add/remove these users you will need to update
entrypoint.sh

- There will be some setup on the user's end in that we will need to give them a key pair (or have them generate it) and have them
point their sftp client to their private key

- SFTPGo has a GUI that starts up on port 8080 by default.

### Misc Commands
OpenShift port-forward to test sftp server locally ```oc port-forward svc/sftpgo 2222:2222```

OpenShift port-forward to access sftp gui locally ```oc port-forward svc/sftpgo 8080:8080```

Remotely connect to pod shell ```oc exec -it <sftpgo-pod> -- /bin/bash``` 

### Backend Environment Variables
Add these to your .env file (anything FTP and not SFTP can be deleted):

```
SFTP_PATH
SFTP_HOST
SFTP_PORT
SFTP_USERNAME
SFTP_PRIVATE_KEY_BASE64
```
