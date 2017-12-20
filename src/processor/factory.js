'use strict';

/**
 * Check if the module exists
 * @param module name name 
 */
function module_exists( name ) {
  try { return require.resolve( name ) }
  catch( e ) { return false }
}

class ProcessorFactory {

  constructor(app_config){
    this.config = app_config;
  }

   getAdapter(entityType, indexName){

    const moduleName = './' + entityType

    if (!module_exists(moduleName))
    {
      console.log('No additional data adapter for ' + adapter_class)
      return null
    }

    let adapter_class = require(moduleName);
    console.log(adapter_class)

    if(!adapter_class)
    {
      console.log('No additional data adapter for ' + adapter_class)
      return null
    }
    else{

      let adapter_instance = new adapter_class(this.config, entityType, indexName);

      if((typeof adapter_instance.isValidFor == 'function') && !adapter_instance.isValidFor(entityType))
        throw new Error('Not valid adapter class or adapter is not valid for ' + entityType);

      return adapter_instance;

    }

  }

}
 
module.exports = ProcessorFactory;
