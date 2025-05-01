# #!/bin/sh

export SFTPGO_DEFAULT_ADMIN_USERNAME=$ADMIN_USER
export SFTPGO_DEFAULT_ADMIN_PASSWORD=$ADMIN_PASSWORD

# SFTPGo config file
cat > /srv/sftpgo/config.json <<EOF
{
  "sftpd": {
    "bindings": [{
      "address": "0.0.0.0",
      "port": 2222
    }]
  },
  "httpd": {
    "bindings": [{
      "address": "0.0.0.0",
      "port": 8080
    }]
  },
  "data_provider": {
    "driver": "sqlite",
    "name": "sftpgo.db",
    "create_default_admin": true
  }
}
EOF

# Users that will be created
cat > /srv/sftpgo/users.json <<EOF
{
  "users": [
    {
      "username": "uploader1",
      "password": "",
      "public_keys": ["$(echo "$UPLOADER1_PUBLIC_KEY" | tr -d '\n')"],
      "home_dir": "/srv/sftpgo/data/uploader1",
      "permissions": { "/": ["list", "download", "upload", "delete", "rename", "overwrite", "copy", "chtimes"], "/uploader1": ["*"] },
      "status": 1,
      "additional_info": ""
    },
    {
      "username": "uploader2",
      "password": "",
      "public_keys": ["$(echo "$UPLOADER2_PUBLIC_KEY" | tr -d '\n')"],
      "home_dir": "/srv/sftpgo/data/uploader2",
      "permissions": { "/": ["list", "download", "upload", "delete", "rename", "overwrite", "copy", "chtimes"], "/uploader2": ["*"] },
      "status": 1,
      "additional_info": ""
    },
    {
      "username": "uploader3",
      "password": "",
      "public_keys": ["$(echo "$UPLOADER3_PUBLIC_KEY" | tr -d '\n')"],
      "home_dir": "/srv/sftpgo/data/uploader3",
      "permissions": { "/": ["list", "download", "upload", "delete", "rename", "overwrite", "copy", "chtimes"], "/uploader3": ["*"] },
      "status": 1,
      "additional_info": ""
    },
    {
      "username": "service",
      "password": "",
      "public_keys": ["$(echo "$SERVICE_PUBLIC_KEY" | tr -d '\n')"],
      "home_dir": "/srv/sftpgo/data",
      "permissions": { "/": ["*"] },
      "status": 1,
      "additional_info": ""
    }
  ],
  "folders": [],
  "version": 1
}
EOF

/usr/local/bin/sftpgo initprovider \
  --config-file /srv/sftpgo/config.json \
  --loaddata-from /srv/sftpgo/users.json \
  --loaddata-mode 1

exec /usr/local/bin/sftpgo serve --config-file /srv/sftpgo/config.json