
  function mapCountryRegion(countryList, countryId, regionCode) {
    let regionId = 0
    for (let country of countryList) {
        if (country.id === countryId) {
            for (let region of country.available_regions) {
                if (region.code === regionCode) {
                    return { regionId: region.id,
                             regionCode: region.code }
                }
            }
        }
    }
    return { regionId: regionId, regionCode: '' }
  }

  module.exports = {
    mapCountryRegion
  }