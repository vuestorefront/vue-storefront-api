import {apiStatus} from '../../../lib/util';
import {Router} from 'express';

const soap = require('soap')

module.exports = ({config, db}) => {
    let glsApi = Router();

    glsApi.get('/zipcode/:zipcode', (req, res) => {
        let url = 'http://www.gls.dk/webservices_v2/wsPakkeshop.asmx?wsdl'
        let args = {zipcode: req.params.zipcode}

        let droppoints = [];

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

        soap.createClient(url, function (err, client) {
            client.GetParcelShopsInZipcode(args, function (err, result) {

                if (result.GetParcelShopsInZipcodeResult) {

                    returnData.droppoints = [];

                    for (let i = 0; i < result.GetParcelShopsInZipcodeResult.PakkeshopData.length; i++) {
                        let droppoint = result.GetParcelShopsInZipcodeResult.PakkeshopData[i]

                        returnData.droppoints.push({
                            id: droppoint.Number,
                            name: droppoint.CompanyName,
                            streetname: droppoint.Streetname,
                            streetname2: droppoint.Streetname2,
                            zipcode: droppoint.ZipCode,
                            country: droppoint.CountryCodeISO3166A2,
                            city: droppoint.CityName,
                            icon: {url: 'assets/gls.png'},
                            position: {
                                lat: parseFloat(droppoint.Latitude),
                                lng: parseFloat(droppoint.Longitude)
                            }
                        })
                    }

                    return apiStatus(res, returnData, 200)
                }

                return apiStatus(res, {error: 'Invalid zipcode.'}, 200)
            })
        })
    })

    return glsApi
}
