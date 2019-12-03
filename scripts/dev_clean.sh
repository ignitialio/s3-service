#!/bin/sh

export SVC_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo "app version: ${SVC_VERSION}"

export IIOS_SERVER_PORT=20199
export IIOS_DOCKER_EXPORTED_PORTS=$IIOS_SERVER_PORT:$IIOS_SERVER_PORT

export IIOS_SERVER_ACCESS_LOGS=false
export IIOS_REST_LOGLEVEL=error
export IIOS_NAMESPACE=ignitialio
export IIOS_DBNAME=ignitialio
export IIOS_SERVER_PATH=public
export IIOS_DROP_FILES_PATH="public/dropped"
export IIOS_S3_SECURE=false
export IIOS_S3_ENDPOINT=localhost
export IIOS_S3_PORT=9000
export IIOS_S3_ACCESS_KEY_ID=G4I3RZP3I2AS7EMWQPMZ
export IIOS_S3_SECRET_ACCESS_KEY=xMzrrXMtnFEOP/K7MDFRA/bPxRfiCYEXOTOTOYEK
export IIOS_EMAILER_SMTP_PASS=toto

if [ -z "$1" ]; then
  echo "stop svc only"
  docker-compose -f docker/docker-compose-dev.yml stop s3
  docker-compose -f docker/docker-compose-dev.yml rm -f s3
else
  echo "stop full docker deploy"
  docker-compose -f docker/docker-compose-dev.yml stop
  docker-compose -f docker/docker-compose-dev.yml rm -f
fi

# if command -v iio 2>/dev/null; then
#   iio infra dev --rm
#   if [ $? -ne 0 ]
#   then
#     echo "iio version must be >=2.2.1: 'npm i -g @ignitial/iio-cli'"
#     exit 1
#   fi
# else
#   echo "iio not installed: 'npm i -g @ignitial/iio-cli'"
#   exit 1
# fi
