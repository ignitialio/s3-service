<template>
  <div :id="id" class="s3-layout">
    <ig-form class="s3-config"
      v-if="!!config && !!schema" v-model="config" :schema="schema"></ig-form>

    <div class="s3-header" v-if="defaultMethod">{{ $t('Defaults') }}</div>

    <div v-if="defaultMethod === 'getObject' && presets">
      <v-text-field v-model="presets[0]" autocomplete="off"
        :label="$t('Bucket name')"></v-text-field>
      <v-text-field v-model="presets[1]" autocomplete="off"
        :label="$t('Object name')"></v-text-field>
    </div>

    <div class="s3-header">{{ $t('Testing') }}</div>

    <div class="s3-test">
      <v-select class="s3-form--item" :label="$t('Buckets')"
        v-model="bucket" :items="buckets" item-text="name"/>

      <v-select v-if="bucket && objects" :disabled="!bucket"
        class="s3-form--item" :label="$t('Files')"
        v-model="object" :items="objects" item-text="name"/>

      <v-btn class="s3-form--item" color="blue lighten-2" @click="handleTest"
        outlined elevation="2" dark v-show="bucket && object"
        prepend="test">
        <v-icon left>check</v-icon>{{ $t('Test') }}</v-btn>

      <div class="s3-error" :class="{ 'active': error !== '' }">
        {{ error }}
      </div>

      <v-icon v-if="tested && testOk" color="green darken-1">check</v-icon>
      <v-icon v-if="tested && !testOk" color="red darken-1">clear</v-icon>
    </div>
  </div>
</template>

<script>
export default {
  props: [
    /* use when source for worklows */
    defaultMethod: {
      type: String
    }
  ],
  data: () => {
    return {
      id: 's3_' + Math.random().toString(36).slice(2),
      config: null,
      schema: null,
      buckets: [],
      bucket: null,
      objects: null,
      object: null,
      tested: false,
      testOk: false,
      error: '',
      presets: null
    }
  },
  watch: {
    bucket: function(val) {
      if (this.s3 && val) {
        this.s3.listObjects(val, null, null).then(docs => {
          this.objects = docs
        }).catch(err => {
          console.log(err)
        })
      }
    },
    defaultMethod: function() {
      this.updatePresetsInitials()
    },
    presets: {
      handler: function(val) {
        this.$services.waitForService('s3').then(s3Service => {
          s3Service.presetMethodArgs(this.defaultMethod, val)
        })
      },
      deep: true
    }
  },
  methods: {
    updatePresetsInitials() {
      switch (this.defaultMethod) {
        case 'getObject':
          // bucket, name
          this.presets = [ '', '']
          break
      }
    },
    handleTest() {
      this.error = ''
      this.tested = true
      this.s3.testGetObject(this.bucket, this.object).then(() => {
        this.testOk = true
      }).catch(err => {
        this.error = err
        console.log(err)
      })
    }
  },
  mounted() {
    // dev
    // refresh service UI on hot reload
    this.$services.once('service:up', service => {
      if (service.name === 's3') {
        localStorage.setItem('HR_PATH', '/service-s3')
        window.location.reload()
      }
    })

    this.$services.waitForService('s3').then(async s3Service => {
      this.s3 = s3Service

      try {
        this.config = await this.s3.getConfig()
        this.schema = this.$services.servicesDico.s3.options.schema
        this.buckets = await this.s3.listBuckets()
      } catch (err) {
        console.log(err)
      }
    }).catch(err => console.log(err))

    if (this.defaultMethod) {
      this.updatePresetsInitials()
    }
  },
  beforeDestroy() {

  }
}
</script>

<style>
.s3-layout {
  width: 100%;
  height: calc(100% - 0px);
  overflow-y: auto;
  padding: 0 16px;
}

.s3-config {
  height: 492px!important;
}

.s3-form--item {
  max-width: 300px;
  margin-left: 16px;
}

.s3-header {
  border-top: 1px solid gainsboro;
  margin: 16px 0;
  padding-top: 16px;
  width: 100%;
  color: dimgray;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.s3-test {
  width: 100%;
  display: flex;
  align-items: center;
}

.s3-error {
  flex: 1;
  padding: 0 8px;
  margin: 0 4px;
}

.s3-error.active {
  background-color: tomato;
  color: white;
}
</style>
