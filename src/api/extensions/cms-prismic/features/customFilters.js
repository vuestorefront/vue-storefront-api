const formatOfData = {
  type: null,
  tags: [],
  content: null
};

const filters = {
  categoryImageSlide:(content, filterOption) => {
    let json = content[0]._source.content;
    for (let property in json.category_slide) {
      if(json.category_slide[property].category_id[0].text === filterOption) {
        return json.category_slide[property].image;
      }
    }
    return {};
  },
  jsonParse: (content) => {
    let json = content;
    if (typeof content === 'string') {
      json = JSON.parse(content);
    }
    return json;
  },
  setCommonFormat: (content) => {
    let result = [];
    if (content[0]._source) { // it is ElasticSearch data
      for (let item of content) {
        let formattedData = Object.assign({}, formatOfData);
        formattedData.type = item._source.prismic_type;
        formattedData.tags = JSON.parse(item._source.prismic_tags);
        formattedData.content = JSON.parse(item._source.content);
        result.push(formattedData);
        formattedData = formatOfData;
      }
    }
    if (content[0].href) { // it is Prismic data
      for (let item of content) {
        let formattedData = Object.assign({}, formatOfData);
        formattedData.type = item.type;
        formattedData.tags = item.tags;
        formattedData.content = item.data;
        result.push(formattedData);
      }
    }
    return result
  }
}

const filterReturnContent = (content, filter, filterOption) => {
  let contentToReturn = filters.jsonParse(content);
  if (filter === 'category_slide' && filterOption) {
    contentToReturn = filters.categoryImageSlide(content, filterOption)
  }

  return filters.setCommonFormat(contentToReturn);
}

export { filterReturnContent };
