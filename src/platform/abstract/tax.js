class AbstractTaxProxy {
    constructor(config){
        this._config = config
    }

    taxFor (product) {
        throw new Error('TaxProxy::taxFor must be implemented for specific platform')
    }

    /**
     * @param Array productList 
     * @returns Promise
     */
    process (productList) {
        throw new Error('TaxProxy::process must be implemented for specific platform')
    }
}

export default AbstractTaxProxy