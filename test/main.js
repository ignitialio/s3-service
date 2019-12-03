import Vue from 'vue'
import S3 from '../src/components/S3.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(S3),
}).$mount('#app')
