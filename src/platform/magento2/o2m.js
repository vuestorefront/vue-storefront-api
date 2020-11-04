const orderUtilities = require('./order/order-utilities');
const orderProcessor = require('./order/orderProcessor');
const apiUtilities = require('./order/api-utilities');

function isNumeric (val) {
  return Number(parseFloat(val)).toString() === val;
}

/**
 * Send single order to Magento Instance
 *
 * The Magento2 API: https://magento.stackexchange.com/questions/136028/magento-2-create-order-using-rest-api
 *
 * @param {json} orderData order data in format as described in '../models/order.md'
 * @param  job
 * @param {Function} done callback - @example done(new Error()) - to acknowledge problems
 */
async function processSingleOrder (orderData, job, done, logger = console) {
  const THREAD_ID = 'ORD:' + (job ? job.id : 1) + ' - '; // job id

  if (!orderProcessor.validateOrder({ orderData, job, done })) {
    return;
  }

  var {
    cart_id: cartId,
    order_id: orderId,
    user_id: userId
  } = orderData;

  logger.info('> Order Id', orderId);
  logger.info('> Is order authorized?', orderUtilities.isThisAuthOrder(orderData));
  logger.info('> User Id', userId);
  logger.info(THREAD_ID + '> Cart Id', cartId)

  try {
    cartId = await orderProcessor.cartIdPrepare(orderData);
    orderData.cart_id = cartId;
  } catch (error) { // cannot create a quote for specific user, so bypass by placing anonymous order
    logger.error(THREAD_ID, error)
    logger.info('< Bypassing to anonymous order')

    if (isNumeric(cartId)) { // we have numeric id - assigned to the user provided
      cartId = await apiUtilities.getApi(orderData.store_code).cart.create(null, null);
      orderData.cart_id = cartId;
    }
  }

  orderProcessor.processCart({ job, orderData, done });
}

module.exports.processSingleOrder = processSingleOrder;
