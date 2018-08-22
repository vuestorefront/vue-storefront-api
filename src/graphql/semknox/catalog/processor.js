import config from 'config'
import ProcessorFactory from '../../../processor/factory'

export default function esResultsProcessor(response, entityType, indexName) {
  return new Promise((resolve, reject) => {
    const factory = new ProcessorFactory(config)
    let resultProcessor = factory.getAdapter(entityType, indexName)

    if (!resultProcessor) {
      resultProcessor = factory.getAdapter('default', indexName) // get the default processor
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

