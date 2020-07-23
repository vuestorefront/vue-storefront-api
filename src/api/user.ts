import { apiStatus, encryptToken, decryptToken, apiError, getToken } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory';
import jwt from 'jwt-simple';
import { merge } from 'lodash';

const Ajv = require('ajv'); // json validator
const fs = require('fs');
const path = require('path');

function addUserGroupToken (config, result) {
  /**
   * Add group id to token
   */
  const data = {
    group_id: result.group_id,
    id: result.id,
    user: result.email
  }

  result.groupToken = jwt.encode(data, config.authHashSecret ? config.authHashSecret : config.objHashSecret)
}

function validateAddresses (currentAddresses = [], newAddresses = []) {
  for (let address of newAddresses) {
    if (!address.customer_id && !address.id) {
      continue
    } else {
      const existingAddress = currentAddresses.find((existingAddress) => existingAddress.id === address.id && existingAddress.customer_id === address.customer_id)
      if (!existingAddress) {
        return 'Provided invalid address.id or address.customer_id'
      }
    }
  }
}

export default ({config, db}) => {
  let userApi = Router();

  const _getProxy = (req) => {
    const platform = config.platform
    const factory = new PlatformFactory(config, req)
    return factory.getAdapter(platform, 'user')
  };

  /**
   * POST create an user
   */
  userApi.post('/create', (req, res) => {
    const ajv = new Ajv();
    const userRegisterSchema = require('../models/userRegister.schema.json')
    let userRegisterSchemaExtension = {};
    if (fs.existsSync(path.resolve(__dirname, '../models/userRegister.schema.extension.json'))) {
      userRegisterSchemaExtension = require('../models/userRegister.schema.extension.json');
    }
    const validate = ajv.compile(merge(userRegisterSchema, userRegisterSchemaExtension))

    if (!validate(req.body)) { // schema validation of upcoming order
      apiStatus(res, validate.errors, 400);
      return;
    }

    const userProxy = _getProxy(req)

    userProxy.register(req.body).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST login an user
   */
  userApi.post('/login', (req, res) => {
    const userProxy = _getProxy(req)

    userProxy.login(req.body).then((result) => {
      /**
      * Second request for more user info
      */
      apiStatus(res, result, 200, {refreshToken: encryptToken(jwt.encode(req.body, config.authHashSecret ? config.authHashSecret : config.objHashSecret), config.authHashSecret ? config.authHashSecret : config.objHashSecret)});
    }).catch(err => {
      apiError(res, err);
    })
  });

  /**
   * POST refresh user token
   */
  userApi.post('/refresh', (req, res) => {
    const userProxy = _getProxy(req)

    if (!req.body || !req.body.refreshToken) {
      return apiStatus(res, 'No refresh token provided', 500);
    }
    try {
      const decodedToken = jwt.decode(req.body ? decryptToken(req.body.refreshToken, config.authHashSecret ? config.authHashSecret : config.objHashSecret) : '', config.authHashSecret ? config.authHashSecret : config.objHashSecret)

      if (!decodedToken) {
        return apiStatus(res, 'Invalid refresh token provided', 500);
      }

      userProxy.login(decodedToken).then((result) => {
        apiStatus(res, result, 200, {refreshToken: encryptToken(jwt.encode(decodedToken, config.authHashSecret ? config.authHashSecret : config.objHashSecret), config.authHashSecret ? config.authHashSecret : config.objHashSecret)});
      }).catch(err => {
        apiError(res, err);
      })
    } catch (err) {
      apiError(res, err);
    }
  });

  /**
   * POST resetPassword (old, keep for backward compatibility)
   */
  userApi.post('/resetPassword', (req, res) => {
    const userProxy = _getProxy(req)

    if (!req.body.email) {
      return apiStatus(res, 'Invalid e-mail provided!', 500)
    }

    userProxy.resetPassword({ email: req.body.email, template: 'email_reset', websiteId: 1 }).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  });

  /**
   * POST resetPassword
   */
  userApi.post('/reset-password', (req, res) => {
    const userProxy = _getProxy(req)
    const { storeCode } = req.query
    const websiteId = storeCode ? config.storeViews[storeCode as string].websiteId : undefined

    if (!req.body.email) {
      return apiStatus(res, 'Invalid e-mail provided!', 500)
    }

    userProxy.resetPassword({ email: req.body.email, template: 'email_reset', websiteId }).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  });

  /**
   * GET  an user
   */
  userApi.get('/me', (req, res) => {
    const userProxy = _getProxy(req)
    const token = getToken(req)
    userProxy.me(token).then((result) => {
      addUserGroupToken(config, result)
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  });

  /**
   * GET  an user order history
   */
  userApi.get('/order-history', (req, res) => {
    const userProxy = _getProxy(req)
    const token = getToken(req)
    userProxy.orderHistory(
      token,
      req.query.pageSize || 20,
      req.query.currentPage || 1
    ).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  });

  /**
   * POST for updating user
   */
  userApi.post('/me', async (req, res) => {
    const ajv = new Ajv();
    const userProfileSchema = require('../models/userProfileUpdate.schema.json')
    let userProfileSchemaExtension = {};
    if (fs.existsSync(path.resolve(__dirname, '../models/userProfileUpdate.schema.extension.json'))) {
      userProfileSchemaExtension = require('../models/userProfileUpdate.schema.extension.json');
    }
    const validate = ajv.compile(merge(userProfileSchema, userProfileSchemaExtension))

    if (req.body.customer && req.body.customer.groupToken) {
      delete req.body.customer.groupToken
    }

    if (!validate(req.body)) {
      console.dir(validate.errors);
      apiStatus(res, validate.errors, 500);
      return;
    }

    const userProxy = _getProxy(req)
    const token = getToken(req)

    try {
      let { website_id, addresses } = await userProxy.me(token)
      const { customer } = req.body

      const validationMessage = validateAddresses(addresses, customer.addresses)
      if (validationMessage) {
        return apiStatus(res, validationMessage, 403)
      }

      const result = await userProxy.update({
        token,
        body: {
          customer: {
            ...customer,
            website_id
          }
        }
      })
      addUserGroupToken(config, result)
      apiStatus(res, result, 200)
    } catch (err) {
      apiStatus(res, err, 500)
    }
  })

  /**
   * POST for changing user's password (old, keep for backward compatibility)
   */
  userApi.post('/changePassword', (req, res) => {
    const userProxy = _getProxy(req)
    const token = getToken(req)
    userProxy.changePassword({ token, body: req.body }).then((result) => {
      apiStatus(res, result, 200)
    }).catch(err => {
      apiStatus(res, err, 500)
    })
  });

  /**
   * POST for changing user's password
   */
  userApi.post('/change-password', (req, res) => {
    const userProxy = _getProxy(req)
    const token = getToken(req)
    userProxy.changePassword({token, body: req.body}).then((result) => {
      apiStatus(res, result, 200)
    }).catch(err => {
      apiStatus(res, err, 500)
    })
  });

  /**
   * POST for changing user's password after reset password with the token
   */
  userApi.post('/create-password', (req, res) => {
    if (!req.body.email) {
      return apiStatus(res, 'email not provided', 500);
    }
    if (!req.body.resetToken) {
      return apiStatus(res, 'resetToken not provided', 500);
    }
    if (!req.body.newPassword) {
      return apiStatus(res, 'newPassword not provided', 500);
    }

    const userProxy = _getProxy(req);
    userProxy
      .resetPasswordUsingResetToken(req.body)
      .then(result => {
        apiStatus(res, result, 200);
      })
      .catch(err => {
        apiStatus(res, err, 500);
      });
  })

  return userApi
}
