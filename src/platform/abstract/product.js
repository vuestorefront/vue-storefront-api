class AbstractProductProxy {
    constructor(config){
        this._config = config
    }

   
    list (skus) { 
        throw new Error('ProductProxy::list must be implemented for specific platform')
    }
}

export default AbstractProductProxy