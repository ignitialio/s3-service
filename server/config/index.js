const fs = require('fs')
const path = require('path')
const YAML = require('yaml')

function envBrowseAndReplace(config) {
  for (let prop in config) {
    if (typeof config[prop] !== 'string' && typeof config[prop] !== 'number') {
      config[prop] = envBrowseAndReplace(config[prop])
    } else {
      if (typeof config[prop] === 'string') {
        let envVarMatch = config[prop].match(/env\((.*?)\)/)
        if (envVarMatch) {
          config[prop] = process.env[envVarMatch[1]]
        }
      }
    }
  }

  return config
}

let generatedConfigPath = path.join(process.cwd(), 'server', 'config', 'generated', 'config.json')
if (fs.existsSync(generatedConfigPath)) {
  let config = JSON.parse(fs.readFileSync(generatedConfigPath, 'utf8'))
  config = envBrowseAndReplace(config)
  console.log('WARNING: using YAML configuration')
  module.exports = config
  return
}

console.log('WARNING: generated file [' + generatedConfigPath + '] does not exist. switch to env config')

// REDIS configuration
// -----------------------------------------------------------------------------
const IIOS_REDIS_PORT = process.env.IIOS_REDIS_PORT ? parseInt(process.env.IIOS_REDIS_PORT) : 6379
const IIOS_REDIS_DB = process.env.IIOS_REDIS_DB ? parseInt(process.env.IIOS_REDIS_DB) : 0
const IIOS_REDIS_ACCESSDB = process.env.IIOS_REDIS_ACCESSDB || 1
let IIOS_REDIS_SENTINELS

if (process.env.IIOS_REDIS_SENTINELS) {
  IIOS_REDIS_SENTINELS = []
  let sentinels = process.env.IIOS_REDIS_SENTINELS.split(',')
  for (let s of sentinels) {
    IIOS_REDIS_SENTINELS.push({ host: s.split(':')[0], port: s.split(':')[1] })
  }
}

const IIOS_S3_ENDPOINT = process.env.IIOS_S3_ENDPOINT || 'localhost'
const IIOS_S3_SECURE = process.env.IIOS_S3_SECURE ? (process.env.IIOS_S3_SECURE === 'true') : false
const IIOS_S3_PORT = process.env.IIOS_S3_PORT ? parseInt(process.env.IIOS_S3_PORT) : undefined
const IIOS_S3_BUCKET = process.env.IIOS_S3_BUCKET || 'ignitialio'
const IIOS_S3_REGION = process.env.IIOS_S3_REGION || 'eu-west-3'

// BUCKET endPoint
var IIOS_S3_BUCKET_ENDPOINT = ''

if (IIOS_S3_ENDPOINT.match('.amazonaws.')) {
  IIOS_S3_BUCKET_ENDPOINT = (IIOS_S3_SECURE ? 'https://' : 'http://') + IIOS_S3_BUCKET + '.' +
    IIOS_S3_ENDPOINT
} else {
  IIOS_S3_BUCKET_ENDPOINT = (IIOS_S3_SECURE ? 'https://' : 'http://') + IIOS_S3_ENDPOINT +
    (IIOS_S3_PORT ? ':' + IIOS_S3_PORT : '') + '/' + IIOS_S3_BUCKET
}

// ACCESS secrets
var IIOS_S3_ACCESS_KEY_ID = process.env.IIOS_S3_ACCESS_KEY_ID
var IIOS_S3_SECRET_ACCESS_KEY = process.env.IIOS_S3_SECRET_ACCESS_KEY

// get from docker secrets
if (!IIOS_S3_ACCESS_KEY_ID || !IIOS_S3_SECRET_ACCESS_KEY) {
  try {
    IIOS_S3_ACCESS_KEY_ID = fs.readFileSync('/run/secrets/s3_access_key_id', 'utf8').replace('\n', '')
    IIOS_S3_SECRET_ACCESS_KEY = fs.readFileSync('/run/secrets/s3_secret_access_key', 'utf8').replace('\n', '')
  } catch (err) {
    console.log('failed to get S3 credentials from file')
    // console.log('<' + process.env.IIOS_S3_ACCESS_KEY_ID + ':' + process.env.IIOS_S3_SECRET_ACCESS_KEY + '>')
  }
}

// Main configuration structure
// -----------------------------------------------------------------------------
module.exports = {
  /* service name */
  name: process.env.IIOS_SERVICE_NAME || 's3',
  /* service namesapce */
  namespace: process.env.IIOS_NAMESPACE || 'ignitialio',
  /* heartbeat */
  heartbeatPeriod: 5000,
  /* PUB/SUB/KV connector */
  connector: {
    /* redis server connection */
    redis: {
      /* encoder to be used for packing/unpacking raw messages */
      encoder: process.env.IIOS_ENCODER || 'bson',
      master: process.env.IIOS_REDIS_MASTER || 'mymaster',
      sentinels: IIOS_REDIS_SENTINELS,
      host: process.env.IIOS_REDIS_HOST,
      port: IIOS_REDIS_PORT,
      db: IIOS_REDIS_DB
    },
  },
  /* access control: if present, acces control enabled */
  accesscontrol: {
    /* access control namespace */
    namespace: process.env.IIOS_NAMESPACE || 'ignitialio',
    /* grants for current service: auto-fill */
    grants: {
      admin: {
        'create:any': [ '*' ],
        'read:any': [ '*' ],
        'update:any': [ '*' ],
        'delete:any': [ '*' ]
      },
      user: {
        'read:any': [ '*' ],
        'update:any': [ '*' ],
        'delete:any': [ '*' ]
      },
      anonymous: {
        'read:any': [ '*' ]
      }
    },
    /* connector configuration: optional, default same as global connector, but
       on DB 1 */
    connector: {
      /* redis server connection */
      redis: {
        encoder: process.env.IIOS_ENCODER || 'bson',
        master: process.env.IIOS_REDIS_MASTER || 'mymaster',
        sentinels: IIOS_REDIS_SENTINELS,
        host: process.env.IIOS_REDIS_HOST,
        port: IIOS_REDIS_PORT,
        db: IIOS_REDIS_ACCESSDB
      }
    }
  },
  /* HTTP server declaration */
  server: {
    /* server host */
    host: process.env.IIOS_SERVER_HOST,
    /* server port */
    port: process.env.IIOS_SERVER_PORT,
    /* path to statically serve (at least one asset for icons for example) */
    path: process.env.IIOS_SERVER_PATH_TO_SERVE || './dist',
    /* indicates that service is behind an HTTPS proxy */
    https: false,
  },
  store: {
    endPoint: IIOS_S3_ENDPOINT,
    useSSL: IIOS_S3_SECURE,
    accessKey: IIOS_S3_ACCESS_KEY_ID,
    secretKey: IIOS_S3_SECRET_ACCESS_KEY,
    port: IIOS_S3_PORT,
    region: IIOS_S3_REGION
  },
  /* options published through discovery mechanism */
  publicOptions: {
    /* declares component injection */
    uiComponentInjection: true,
    /* service description */
    description: {
      /* service icon */
      icon: 'assets/s3-64.png',
      /* Internationalization: see Ignitial.io Web App */
      i18n: {
        'S3': [ 'S3' ],
        'Object storage':  [
          'Stockage d\'objets'
        ],
        'S3 and compatible object storage access': [
          'Accès aux stockage d\'objets type S3'
        ],
        'Test': [
          'Tester'
        ],
        'Testing': [
          'Test'
        ],
        'Buckets': [
          'Seaux (Buckets)'
        ],
        'Files': [
          'Fichiers'
        ]
      },
      /* eventually any other data */
      title: 'Object storage',
      info: 'S3 and compatible object storage access'
    },
    /* domain related public options: could be any JSON object*/
    schema: {
      title: 'Configuration',
      type: 'object',
      _meta: {
        type: null
      },
      properties: {
        endPoint: {
          title: 'Endpoint',
          type: 'string',
          _meta: {
            type: null,
            i18n: {
              'Endpoint': [ 'Point de connexion' ]
            }
          }
        },
        useSSL: {
          title: 'Secured',
          type: 'boolean',
          _meta: {
            type: null,
            i18n: {
              'Secured': [ 'Sécurisé' ]
            }
          }
        },
        accessKey: {
          title: 'Access key',
          type: 'string',
          _meta: {
            type: null,
            i18n: {
              'Access key': [ 'Clé d\'accès' ]
            }
          }
        },
        secretKey: {
          title: 'Secret key',
          type: 'string',
          _meta: {
            type: 'password',
            i18n: {
              'Secret key': [ 'Clé secrète' ]
            }
          }
        },
        port: {
          title: 'Port',
          type: 'integer',
          _meta: {
            type: 'integer',
            min: 1024,
            max: 65535,
            i18n: {
              'Port': [ 'Port' ]
            }
          }
        },
        region: {
          title: 'Region',
          type: 'string',
          _meta: {
            type: null,
            i18n: {
              'Region': [ 'Région' ]
            }
          }
        }
      }
    }
  }
}
