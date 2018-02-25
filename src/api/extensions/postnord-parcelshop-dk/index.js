import {apiStatus} from '../../../lib/util';
import {Router} from 'express';

const request = require('request');

module.exports = ({config, db}) => {
    let glsApi = Router();

    glsApi.get('/zipcode/:zipcode', (req, res) => {
        if (req.params.zipcode.length != 4) {
            return apiStatus(res, {error: 'Invalild zipcode length.'}, 200)
        }

        let returnData = {};

        returnData.extraFields = {
            pickup_name: {
                title: "Name of person who will pick up the package",
                required: true
            }
        }
        returnData.droppoints = []

        const url = 'https://api2.postnord.com/rest/businesslocation/v1/servicepoint/findNearestByAddress.json?apikey=' + config.postnordParcehshopDKApiKey + '&countryCode=DK&postalCode=' + req.params.zipcode

        request({ //
            uri: url,
            method: 'GET',
            json: true,
        }, function (_err, _res, _resBody) {
            console.log(_resBody)
            if (_resBody && _resBody.servicePointInformationResponse.servicePoints) {
                let latitude = 0;
                let longitude = 0;

                const results = _resBody.servicePointInformationResponse.servicePoints
                let length = 0

                for (let i = 0; i < results.length; i++) {
                    const droppoint = results[i]

                    returnData.droppoints.push({
                        id: droppoint.servicePointId,
                        name: droppoint.name,
                        streetname: droppoint.deliveryAddress.streetName + ' ' + droppoint.deliveryAddress.streetNumber,
                        streetname2: 'Pakkeboks: ' + droppoint.servicePointId,
                        zipcode: droppoint.deliveryAddress.postalCode,
                        country: droppoint.deliveryAddress.countryCode,
                        city: droppoint.deliveryAddress.city,
                        icon: {url: 'assets/postnord.png'},
                        position: {
                            lat: parseFloat(droppoint.coordinate.northing),
                            lng: parseFloat(droppoint.coordinate.easting)
                        }
                    })

                    latitude += parseFloat(droppoint.coordinate.northing)
                    longitude += parseFloat(droppoint.coordinate.easting)
                    length = i + 1
                }

                returnData.center = {
                    position: {
                        lat: parseFloat(latitude) / length,
                        lng: parseFloat(longitude) / length
                    }
                }

                return apiStatus(res, returnData, 200)
            }

            return apiStatus(res, {error: 'Invalid zipcode.'}, 200)
        })
    })

    return glsApi
}
