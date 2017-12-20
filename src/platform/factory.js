'use strict';

class PaltformFactory {

  constructor(app_config){
    this.config = app_config;
  }

   getAdapter(platform, type, ...constructorParams){

    console.log('./' + platform + '/' + type)
    let adapter_class = require('./' + platform + '/' + type);
    console.log(adapter_class)

    if(!adapter_class)
      throw new Error('Invalid adapter ' + platform + ' / ' + type);
    else{

      let adapter_instance = new adapter_class(this.config, ...constructorParams);

      if((typeof adapter_instance.isValidFor == 'function') && !adapter_instance.isValidFor(type))
        throw new Error('Not valid adapter class or adapter is not valid for ' + type);

      return adapter_instance;

    }

  }

}
 
module.exports = PaltformFactory;
