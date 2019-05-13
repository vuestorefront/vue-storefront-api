import config from 'config'
import ProcessorFactory from '../../../processor/factory'

export default function esResultsProcessor(response, entityType, indexName, req, res) {
  return new Promise((resolve, reject) => {
    const factory = new ProcessorFactory(config)
    let resultProcessor = factory.getAdapter(entityType, indexName, req, res)

    if (!resultProcessor) {
      resultProcessor = factory.getAdapter('default', indexName, req, res) // get the default processor
    }

    resultProcessor.process(response.hits.hits)
      .then((result) => {
        resolve(result)
      })
      .catch((err) => {
        console.error(err)
      })
  })
}

