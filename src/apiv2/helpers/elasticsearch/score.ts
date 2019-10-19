import config from 'config'

export default function getFunctionScores () {
  const searchScoring = config.get('elasticsearch.searchScoring')
  if (!searchScoring) {
    return false
  }
  let filter = []
  let esScoringAttributes = config.get('elasticsearch.searchScoring.attributes')

  if (!Object.keys(esScoringAttributes).length) {
    return false
  }
  for (const attribute of Object.keys(esScoringAttributes)) {
    for (const scoreValue of Object.keys(esScoringAttributes[attribute].scoreValues)) {
      let data = {
        'filter': {
          'match': {
            [attribute]: scoreValue
          }
        },
        'weight': esScoringAttributes[attribute].scoreValues[scoreValue].weight
      }
      filter.push(data)
    }
  }
  if (filter.length) {
    return {'functions': filter,
      'score_mode': config.get('elasticsearch.searchScoring.score_mode') ? config.get('elasticsearch.searchScoring.score_mode') : 'multiply',
      'boost_mode': config.get('elasticsearch.searchScoring.boost_mode') ? config.get('elasticsearch.searchScoring.boost_mode') : 'multiply',
      'max_boost': config.get('elasticsearch.searchScoring.max_boost') ? config.get('elasticsearch.searchScoring.max_boost') : 100,
      'min_score': config.get('elasticsearch.searchScoring.function_min_score') ? config.get('elasticsearch.searchScoring.function_min_score') : 1
    }
  }
  return false
}
