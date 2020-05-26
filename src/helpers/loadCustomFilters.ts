import path from 'path'

export default async function loadModuleCustomFilters (config: Record<string, any>, type: string = 'catalog'): Promise<any> {
  let filters: any = {}
  let filterPromises: Promise<any>[] = []

  for (const mod of config.registeredExtensions) {
    if (config.extensions.hasOwnProperty(mod) && config.extensions[mod].hasOwnProperty(type + 'Filter') && Array.isArray(config.extensions[mod][type + 'Filter'])) {
      const moduleFilter = config.extensions[mod][type + 'Filter']
      const dirPath = [__dirname, '../api/extensions/' + mod + '/filter/', type]
      for (const filterName of moduleFilter) {
        const filePath = path.resolve(...dirPath, filterName)
        filterPromises.push(
          import(filePath)
            .then(module => {
              filters[filterName] = module.default
            })
            .catch(e => {
              console.log(e)
            })
        )
      }
    }
  }

  return Promise.all(filterPromises).then((e) => filters)
}
