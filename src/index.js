import S3 from './components/S3.vue'

// function to be called when service loaded into web app:
// naming rule: iios_<service_unique_name>
//
global.iios_s3 = function(Vue) {
  // Warning: component name must be globally unique in your host app
  Vue.component('s3', S3)

  let register = () => {
    // EXEAMPLE
    Vue.prototype.$services.emit('app:menu:add', [
      {
        path: '/service-s3',
        title: 'Object storage',
        svgIcon: '$$service(s3)/assets/s3-64.png',
        section: 'Services',
        anonymousAccess: true,
        hideIfLogged: false,
        route: {
          name: 'S3',
          path: '/service-s3',
          component: S3
        }
      }
    ])

    let onServiceDestroy = () => {
      Vue.prototype.$services.emit('app:menu:remove', [{
        path: '/service-s3'
      }])

      Vue.prototype.$services.emit('service:destroy:s3:done')
    }

    Vue.prototype.$services.once('service:destroy:s3', onServiceDestroy)
  }

  if (Vue.prototype.$services.appReady) {
    register()
  } else {
    Vue.prototype.$services.once('app:ready', register)
  }
}
