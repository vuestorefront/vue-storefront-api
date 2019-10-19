import config from 'config'

function getConfig (queryText) {
  const configElasticScoring = config.get('elasticsearch.searchScoring')
  let scoringConfig: any = configElasticScoring || {}
  const minimumShouldMatch = config.get('elasticsearch.searchScoring.minimum_should_match') ? config.get('elasticsearch.searchScoring.minimum_should_match') + '25' : '75%25'

  // Create config for multi match query
  let multiMatchConfig = {
    'query': queryText,
    'operator': scoringConfig.operator ? scoringConfig.operator : 'or',
    'fuzziness': scoringConfig.fuzziness ? scoringConfig.fuzziness : '2',
    'cutoff_frequency': scoringConfig.cutoff_frequency ? scoringConfig.cutoff_frequency : '0.01',
    'max_expansions': scoringConfig.max_expansions ? scoringConfig.max_expansions : '3',
    'prefix_length': scoringConfig.prefix_length ? scoringConfig.prefix_length : '1',
    'minimum_should_match': minimumShouldMatch,
    'tie_breaker': scoringConfig.tie_breaker ? scoringConfig.tie_breaker : '1'
  }
  if (scoringConfig.hasOwnProperty('analyzer')) {
    multiMatchConfig['analyzer'] = scoringConfig.analyzer
  }
  return multiMatchConfig
}

export default function getMultiMatchConfig (queryText) {
  return getConfig(queryText)
}
