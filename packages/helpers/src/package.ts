import fs from 'fs-extra'
import path from 'path'

const walk = async (dirPath: string) =>
  Promise.all(
    await fs.readdir(dirPath, { withFileTypes: true }).then((entries) =>
      entries.map((entry: any): any => {
        const childPath = path.join(dirPath, entry.name)
        return entry.isDirectory() ? walk(childPath) : childPath
      })
    )
  )

export const parseExports = async (folderName: string) => {
  const files = await walk(path.resolve('src', folderName))
  const exportsList = files!
    .flat()
    .filter((f: string) => f.includes('.json'))
    .map((f: string) => {
      // make sure all path exists
      fs.pathExistsSync(path.resolve(f))
      // get contractName
      const contractName = path.parse(f).name
      const exportPath = `./${path
        .relative(process.cwd(), f)
        .replace('src/abis/', '')}`
      return {
        contractName,
        exportPath,
      }
    })
  return exportsList
}

export const createIndexFile = async (
  srcFolder: string,
  destFolder: string
) => {
  const fileContent = ['/* eslint-disable */']
  fileContent.push("// This file is generated, please don't edit directly")
  fileContent.push("// Refer to 'yarn build:index' for more\n")

  const abiFiles = await parseExports(srcFolder)

  abiFiles.forEach(({ contractName, exportPath }) =>
    fileContent.push(`import ${contractName} from '${exportPath}'`)
  )

  fileContent.push('\n// exports')

  abiFiles.forEach(({ contractName }) =>
    fileContent.push(`export { ${contractName} }`)
  )

  await fs.outputFile(
    path.resolve(destFolder, srcFolder, 'index.ts'),
    fileContent.join('\n')
  )
}
