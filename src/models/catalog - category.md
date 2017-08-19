Category model
==============

Categories are stored in ElasticSearch repository in the following format:

```json
{  
   "_index":"magento2_default_catalog_category_20170817_075531",
   "_type":"category",
   "_id":"8",
   "_version":1,
   "_score":1,
   "_source":{  
      "entity_id":"8",
      "attribute_set_id":"3",
      "parent_id":"7",
      "created_at":"2017-04-06 15:42:48",
      "updated_at":"2017-07-12 08:24:10",
      "path":"1/2/8",
      "position":"143",
      "level":"3",
      "children_count":"0",
      "erp_id":"1074115879",
      "is_active":"1",
      "name":[  
         "pojzady"
      ],
      "url_path":[  
         "Zabawki/pojzady-3848"
      ]
   }
}
```