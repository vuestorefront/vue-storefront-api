const merge = require('lodash/merge')
const fs = require('fs');
const Ajv = require('ajv'); // json validator
const ajv = new Ajv(); // validator
const orderSchema = require('../../../models/order.schema.js')
let orderSchemaExtension = {}
if (fs.existsSync('../../../models/order.schema.extension.json')) {
  orderSchemaExtension = require('../../../models/order.schema.extension.json')
}
const validate = ajv.compile(merge(orderSchema, orderSchemaExtension));

function getBillingAddress (billingAddr, mappedBillingRegion) {
  return { // sum up totals
    'address': {
      'country_id': billingAddr.country_id,
      'street': billingAddr.street,
      'telephone': billingAddr.telephone,
      'postcode': billingAddr.postcode,
      'city': billingAddr.city,
      'firstname': billingAddr.firstname,
      'lastname': billingAddr.lastname,
      'email': billingAddr.email,
      'region_code': mappedBillingRegion.regionCode,
      'region_id': mappedBillingRegion.regionId,
      'company': billingAddr.company,
      'vatId': billingAddr.vat_id,
      'save_in_address_book': billingAddr.save_address
    }
  };
}

function getShippingAddressInformation (
  billingAddr,
  mappedBillingRegion,
  orderData,
  mappedShippingRegion
) {
  const shippingAddr = orderData.addressInformation.shippingAddress;

  var shippingAddressInfo = { // sum up totals
    'addressInformation': {
      'billingAddress': getBillingAddress(billingAddr, mappedBillingRegion).address,
      'shippingMethodCode': orderData.addressInformation.shipping_method_code,
      'shippingCarrierCode': orderData.addressInformation.shipping_carrier_code,
      'extensionAttributes': orderData.addressInformation.shippingExtraFields
    }
  }

  if (typeof shippingAddr !== 'undefined' && shippingAddr !== null) {
    shippingAddressInfo['addressInformation']['shippingAddress'] = {
      'countryId': shippingAddr.country_id,
      'street': shippingAddr.street,
      'telephone': shippingAddr.telephone,
      'postcode': shippingAddr.postcode,
      'city': shippingAddr.city,
      'firstname': shippingAddr.firstname,
      'lastname': shippingAddr.lastname,
      'email': shippingAddr.email,
      'regionId': mappedShippingRegion.regionId,
      'regionCode': mappedShippingRegion.regionCode,
      'region': shippingAddr.region,
      'company': shippingAddr.company,
      'save_in_address_book': shippingAddr.save_address
    }
  } else {
    shippingAddressInfo['addressInformation']['shippingAddress'] = shippingAddressInfo['addressInformation']['billingAddress'];
  }

  return shippingAddressInfo;
}

/**
 * Verify if order data is valid
 *
 * @param {json} orderData order data in format as described in '../models/order.md'
 * @returns {boolean | PromiseLike<any>}
 */
function isOrderValid (orderData) {
  return validate(orderData);
}

/**
 * @param {json} orderData order data in format as described in '../models/order.md'
 * @param orderData
 * @returns {Array<ajv.ErrorObject>}
 */
function getOrderErrors (orderData) {
  validate(orderData)

  return validate.errors;
}

/**
 * Internal function to compose Error object using messages about other errors.
 *
 * 'Error' constructor should contain one message object only.
 * (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Error)
 *
 * @param {string} message Main error message.
 * @param {string|array|object} errors Additional error message or error object or array of array objects.
 * @return {Error}
 */
function composeError (message, errors) {
  if (typeof errors === 'string') {
    message = message + ' ' + errors;
  } else if (Array.isArray(errors)) {
    // case with array of validation errors (ajv.ErrorObject - node_modules/ajv/lib/ajv.d.ts)
    errors.forEach((item) => {
      const part = (typeof item === 'string') ? item : (item.message || '');
      message = (message + ' ' + part).trim();
    });
  } else if (errors && (errors.message || errors.errorMessage)) {
    // I don't know possible structure of an 'errors' in this case, so I take 'apiError()' from 'src/lib/util.js'
    // we should use debugger to inspect this case in more details and modify code.
    message = message + ' ' + (errors.message || errors.errorMessage);
  }
  return new Error(message.trim());
}

/**
 * @param {json} orderData order data in format as described in '../models/order.md'
 * @returns {boolean}
 */
function isThisAuthOrder (orderData) {
  return parseInt(orderData.user_id) > 0;
}

function getThreadId (job) {
  return 'ORD:' + (job ? job.id : 1) + ' - ';
}

module.exports = {
  validateOrder: isOrderValid,
  getOrderErrors,
  getBillingAddress,
  composeError,
  isThisAuthOrder,
  getShippingAddressInformation,
  getThreadId
}
