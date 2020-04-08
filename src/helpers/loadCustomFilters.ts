import { promises as fs } from 'fs'
import path from 'path'

function getModuleFilterPaths (moduleName: string, type: string): Promise<any> {
  const dirPath = path.resolve(__dirname, '../../' + moduleName + '/filter/', type)
  return fs.readdir(dirPath)
    .then(files => files.filter(f => f.endsWith('Filter.ts')).map(file => ({ path: path.resolve(dirPath, file), file })))
    .catch(() => {
      return []
    })
}

export default async function loadModuleCustomFilters (config: Record<string, any>, type: string = 'catalog'): Promise<any> {
  let filters: any = {}
  let filterPromises: Promise<any>[] = []

  for (const ext in config.registeredExtensions) {
    filterPromises.push(
      getModuleFilterPaths(config.registeredExtensions[ext], type)
        .then(filePaths => filePaths.forEach(o => import(o.path)
          .then(module => {
            filters[o.file] = module.default
          })
          .catch(e => {
            console.log(e)
          }))
        )
    )
  }

  return Promise.all(filterPromises).then((e) => filters)
}
