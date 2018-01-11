class AbstractCartProxy  {
    /**
     * 
     * @param {*} customerToken 
     * 
     * @returns {
     *               "code": 200,
     *               "result": "a7b8e47aef108a8d0731c368a603a9af" <-- cart id
     *           }
     */
    create (customerToken) { 
    }        
    
    update (customerToken, cartItem) { 
    }       

    delete (customerToken, cartItem) { 
    }        
}

module.exports = AbstractCartProxy