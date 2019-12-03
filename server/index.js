const Minio = require('minio')
const fs = require('fs')
const path = require('path')

const Service = require('@ignitial/iio-services').Service
const utils = require('@ignitial/iio-services').utils
const config = require('./config')

class S3 extends Service {
  constructor(options) {
    super(options)

    this._minioClient = new Minio.Client(this._options.store)
  }

  // set configuration and create client
  // ***************************************************************************
  setConfig(options) {
    /* @_POST_ */
    return new Promise((resolve, reject) => {
      try {
        this._options.store = options
        this._minioClient = new Minio.Client(this._options.store)
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }

  // get configuration
  // ***************************************************************************
  getConfig() {
    return new Promise((resolve, reject) => {
      resolve(this._options.store)
    })
  }

  // creates S3 bucket if does not exist
  // ***************************************************************************
  createBucket(name) {
    /* @_PUT_ */
    return new Promise((resolve, reject) => {
      // not to be used with S3 due to endpoint creation delays
      this._minioClient.bucketExists(bucket, (err, exists) => {
        if (!err && !exists) {
          this._minioClient.makeBucket(bucket, this.options.store.region, errOnMake => {
            if (errOnMake) {
              reject(errOnMake)
            } else {
              resolve(name)
            }
          })
        } else if (err) {
          reject(err)
        } else {
          resolve(name)
        }
      })
    })
  }

  // get an object from S3
  // ***************************************************************************
  getObject(bucket, name) {
    /* @_GET_ */
    return new Promise((resolve, reject) => {
      this._minioClient.getObject(bucket, name, (err, readableStream) => {
        if (err) {
          reject(err)
        } else {
          let streamId = 's3:file:' + bucket + ':' + name + ':' + utils.uuid()
          let stream = this._addStream(streamId)
          readableStream.pipe(stream)
          readableStream.once('close', () => {
            setTimeout(() => {
              this._removeStream(stream)
            }, 5000)
          })

          resolve(streamId)
        }
      })
    })
  }

  // get an object from S3
  // ***************************************************************************
  testGetObject(bucket, name) {
    /* @_GET_ */
    return new Promise((resolve, reject) => {
      this.getObject(bucket, name).then(streamId => {
        let inputStreamId = 's3:file:input:' + bucket + ':' + name + ':' + utils.uuid()
        // input stream
        let stream = this._addStream(inputStreamId, streamId)

        let testStream = fs.createWriteStream(path.join(__dirname, './test.data'))
        testStream.pipe(stream)

        testStream.on('error', err => {
          reject(err)
          this._removeStream(inputStreamId)
        })

        testStream.on('end',  () => {
          try {
            fs.unlinkSync(path.join(__dirname, './test.data'))
            this._removeStream(inputStreamId)
            resolve()
          } catch (err) {
            reject(err)
            this._removeStream(inputStreamId)
          }
        })
      })
    })
  }

  // put an object to S3
  // ***************************************************************************
  putObject(bucket, name, streamId, size) {
    /* @_PUT_ */
    return new Promise((resolve, reject) => {
      let inputStreamId = 's3:file:input:' + bucket + ':' + name + ':' + utils.uuid()
      // input stream
      let stream = this._addStream(inputStreamId, streamId)

      this._minioClient.putObject(bucket, name, stream, size, (err, etag) => {
        if (err) {
          reject(err)
        } else {
          resolve(bucket, name, etag)
          this._removeStream(inputStreamId)
        }
      })
    })
  }

  // list buckets
  // ***************************************************************************
  listBuckets() {
    /* @_GET_ */
    return new Promise((resolve, reject) => {
      this._minioClient.listBuckets().then(docs => {
        resolve(docs)
      }).catch(err => reject(err))
    })
  }

  // list objects
  // ***************************************************************************
  listObjects(bucket, prefix, recursive) {
    /* @_GET_ */
    return new Promise((resolve, reject) => {
      let stream = this._minioClient.listObjects(bucket,
        prefix || undefined, recursive || undefined)

      let objs = []
      stream.on('data', function(obj) {
        objs.push(obj)
      })

      stream.on('error', function(err) {
        reject(err)
      })

      stream.on('end', function(err) {
        resolve(objs)
      })
    })
  }
}

// instantiate service with its configuration
const s3 = new S3(config)

s3._init().then(() => {
  console.log('service [' + s3.name + '] initialization done with options ',
    s3._options)
}).catch(err => {
  console.error('initialization failed', err)
  process.exit(1)
})
