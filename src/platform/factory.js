'use strict';

class PlatformFactory {

  constructor(app_config, req = null){
    this.config = app_config;
    this.request = req
  }

  getAdapter(platform, type, ...constructorParams){
    let adapter_class = require('./' + platform + '/' + type);
    if (!adapter_class) {
      throw new Error('Invalid adapter ' + platform + ' / ' + type);
    } else {
      let adapter_instance = new adapter_class(this.config, this.request, ...constructorParams);
      if((typeof adapter_instance.isValidFor == 'function') && !adapter_instance.isValidFor(type))
        throw new Error('Not valid adapter class or adapter is not valid for ' + type);
      return adapter_instance;
    }
  }
}

module.exports = PlatformFactory;
