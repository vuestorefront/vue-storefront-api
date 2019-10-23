import {apiStatus} from '../../../lib/util';
import {Router} from 'express';

const {Magento2Client} = require('magento2-rest-client');

interface CmsRestInterface {
  getPage: (id: string | number) => Promise<any>,
  getBlock: (id: string | number) => Promise<any>,
  getPageIdentifier: (identifier: string, storeId: string) => Promise<any>,
  getBlockIdentifier: (identifier: string, storeId: string) => Promise<any>
}

module.exports = ({config, db}) => {
  let cmsApi = Router();

  const client = Magento2Client(config.magento2.api);

  client.addMethods('cmsData', (restClient) => {
    return {
      getPage: function (id: string | number) {
        return restClient.get(`/snowdog/cmsPage/${id}`);
      },
      getBlock: function (id: string | number) {
        return restClient.get(`/snowdog/cmsBlock/${id}`);
      },
      getPageIdentifier: function (identifier: string, storeId: string) {
        return restClient.get(`/snowdog/cmsPageIdentifier/${identifier}/storeId/${storeId}`);
      },
      getBlockIdentifier: function (identifier: string, storeId: string) {
        return restClient.get(`/snowdog/cmsBlockIdentifier/${identifier}/storeId/${storeId}`);
      }
    } as CmsRestInterface;
  });

  cmsApi.get('/cmsPage/:id', async (req, res) => {
    try {
      const result = await client.cmsData.getPage(req.params.id);

      apiStatus(res, result, 200);
    } catch (err) {
      apiStatus(res, err, 500);
    }
  });

  cmsApi.get('/cmsBlock/:id', async (req, res) => {
    try {
      const result = await client.cmsData.getBlock(req.params.id);

      apiStatus(res, result, 200);
    } catch (err) {
      apiStatus(res, err, 500);
    }
  });

  cmsApi.get('/cmsPageIdentifier/:identifier/storeId/:storeId', async (req, res) => {
    try {
      const result = await client.cmsData.getPageIdentifier(
        req.params.identifier,
        req.params.storeId
      );

      apiStatus(res, result, 200);
    } catch (err) {
      apiStatus(res, err, 500);
    }
  });

  cmsApi.get('/cmsBlockIdentifier/:identifier/storeId/:storeId', async (req, res) => {
    try {
      const result = await client.cmsData.getBlockIdentifier(
        req.params.identifier,
        req.params.storeId
      );

      apiStatus(res, result, 200);
    } catch (err) {
      apiStatus(res, err, 500);
    }
  });

  return cmsApi
};
