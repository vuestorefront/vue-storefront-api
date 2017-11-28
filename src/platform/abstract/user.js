class AbstractUserProxy {
    constructor(config){
        this._config = config
    }

    register (userData) { 
        throw new Error('UserProxy::register must be implemented for specific platform')
    }
    
    login (userData) { 
        throw new Error('UserProxy::login must be implemented for specific platform')
    }    
}

export default AbstractUserProxy