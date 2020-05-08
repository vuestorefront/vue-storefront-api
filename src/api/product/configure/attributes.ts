import uniqBy from 'lodash/uniqBy'

export function transformMetadataToAttributes (attributeMetadata) {
  return attributeMetadata
    .reduce((prev, curr) => ([ ...prev, ...curr ]), [])
    .reduce((prev, curr) => {
      const attribute = prev.find(a => a.attribute_id === curr.attribute_id && a.options)

      if (attribute) {
        return prev.map(attr => {
          if (attr.attribute_id === curr.attribute_id) {
            return {
              ...attr,
              options: uniqBy([...attr.options, ...curr.options], (obj) => `${obj.label}_${obj.value}`)
            }
          }

          return attr
        })
      }

      return [...prev, curr]
    }, [])
    .reduce((prev, curr) => ({
      list_by_code: {
        ...(prev.list_by_code || {}),
        [curr.attribute_code]: curr
      },
      list_by_id: {
        ...(prev.list_by_id || {}),
        [curr.attribute_id]: curr
      }
    }), { list_by_code: {}, list_by_id: {} })
}
