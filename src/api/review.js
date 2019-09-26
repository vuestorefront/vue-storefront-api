import { apiStatus, apiError } from '../lib/util'; import { Router } from 'express';
import PlatformFactory from '../platform/factory'

const Ajv = require('ajv'); // json validator

export default ({config, db}) => {
  const reviewApi = Router();

  const _getProxy = (req) => {
    const platform = config.platform
    const factory = new PlatformFactory(config, req)
    return factory.getAdapter(platform, 'review')
  };

  reviewApi.post('/create', (req, res) => {
    const ajv = new Ajv();
    const reviewProxy = _getProxy(req)
    const reviewSchema = require('../models/review.schema')
    const validate = ajv.compile(reviewSchema)

    req.body.review.review_status = config.review.defaultReviewStatus

    if (!validate(req.body)) {
      console.dir(validate.errors);
      apiStatus(res, validate.errors, 500);
      return;
    }

    reviewProxy.create(req.body.review).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  return reviewApi
}
