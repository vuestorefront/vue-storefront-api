/**
 * Default not logged user grouped ID
 * @type {number}
 */
const NotLoggedUserGroupId = 0;

/**
 * Set price by tier and reduce tiers
 *
 * @param _resBody
 * @param groupId
 * @returns {*}
 */
export default (_resBody, groupId) => {
  groupId = groupId || NotLoggedUserGroupId;
  _resBody.hits.hits.forEach((product, index) => {
    let price = _resBody.hits.hits[index]._source.price;
    let specialPrice = _resBody.hits.hits[index]._source.specialPriceInclTax;

    if (_resBody.hits.hits[index]._source.tier_prices) {
      for (let i = _resBody.hits.hits[index]._source.tier_prices.length - 1; i >= 0; i--) {
        let tier = _resBody.hits.hits[index]._source.tier_prices[i];
        // Check group
        if (tier.customer_group_id === groupId) {
          if (tier.qty === 1) {
            if (_resBody.hits.hits[index]._source.priceInclTax > tier.value) {
              specialPrice = 0
              _resBody.hits.hits[index]._source.priceInclTax = tier.value;
              _resBody.hits.hits[index]._source.price = tier.value
            }
          }
        } else {
          _resBody.hits.hits[index]._source.tier_prices.splice(i, 1)
        }
      }
    }
  })

  return _resBody;
}
