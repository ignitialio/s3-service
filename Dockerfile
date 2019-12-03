FROM node:12-alpine

RUN mkdir -p /opt && mkdir -p /opt/s3

ADD . /opt/s3

WORKDIR /opt/s3

RUN npm install && npm run client:build

CMD ["node", "./server/index.js"]
