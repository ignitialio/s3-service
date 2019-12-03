#!/bin/sh

if command -v iio 2>/dev/null; then
  iio infra dev
  if [ $? -ne 0 ]
  then
    echo "iio version must be >=2.2.1: 'npm i -g @ignitial/iio-cli'"
    exit 1
  fi
else
  echo "iio not installed: 'npm i -g @ignitial/iio-cli'"
  exit 1
fi

export SVC_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo "app version: ${SVC_VERSION}"

export IIOS_NAMESPACE=ignitialio
export IIOS_SERVER_PORT=20399
export IIOS_DOCKER_EXPORTED_PORTS=$IIOS_SERVER_PORT:$IIOS_SERVER_PORT

docker-compose up -d
