class AbstractUserProxy {
  constructor (config, req) {
    this._config = config
    this._request = req
  }

  /**
   *
   * EXAMPLE INPUT:
   * {
   *       "customer": {
   *           "email": "jfoe@vuestorefront.io",
   *           "firstname": "Jon",
   *           "lastname": "Foe"
   *       },
   *       "password": "!@#foearwato"
   *  }
   *
   * EXAMPLE OUTPUT:
   *
   *  {
   *       "code": 200,
   *       "result": {
   *           "id": 3,
   *           "group_id": 1,
   *           "created_at": "2017-11-28 19:22:51",
   *           "updated_at": "2017-11-28 19:22:51",
   *           "created_in": "Default Store View",
   *           "email": "pkarwatka@divante.pl",
   *           "firstname": "Piotr",
   *           "lastname": "Karwatka",
   *           "store_id": 1,
   *           "website_id": 1,
   *           "addresses": [],
   *           "disable_auto_group_change": 0
   *       }
   *   }
   * @param {*} userData
   */
  register (userData) {
    throw new Error('UserProxy::register must be implemented for specific platform')
  }

  /**
   * EXAMPLE INPUT:
   *
   *    {
   *        "username": "pkarwatka@divante.pl",
   *        "password": "********"
   *    }
   *
   * EXAMPLE OUTPUT:
   * {
   *        "code": 200,
   *        "result": "3tx80s4f0rhkoonqe4ifcoloktlw9glo"
   *    }
   */
  login (userData) {
    throw new Error('UserProxy::login must be implemented for specific platform')
  }

  /**
   * EXAMPLE INPUT:
   * - just provide an consumer token from login method
   *
   * EXAMPLE OUTPUT:
   *
   * {
   *       "code": 200,
   *       "result": {
   *           "id": 3,
   *           "group_id": 1,
   *           "created_at": "2017-11-28 19:22:51",
   *           "updated_at": "2017-11-28 20:01:17",
   *           "created_in": "Default Store View",
   *           "email": "pkarwatka@divante.pl",
   *           "firstname": "Piotr",
   *           "lastname": "Karwatka",
   *           "store_id": 1,
   *           "website_id": 1,
   *           "addresses": [],
   *           "disable_auto_group_change": 0
   *       }
   *   }
   *
   * } requestToken
   */
  me (requestToken) {
    throw new Error('UserProxy::me must be implemented for specific platform')
  }
  orderHistory (requestToken) {
    throw new Error('UserProxy::orderHistory must be implemented for specific platform')
  }
  resetPassword (emailData) {
    throw new Error('UserProxy::resetPassword must be implemented for specific platform')
  }
}

export default AbstractUserProxy
