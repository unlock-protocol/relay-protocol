import fs from 'fs-extra'
import semver from 'semver'
import path from 'path'

import { task } from 'hardhat/config'
import { createIndexFile } from '@relay-protocol/helpers'

const packageFolder = path.resolve('../packages/abis')

const ignored = [
  'hardhat/console.sol:console',
  '@openzeppelin/contracts',
  'contracts/utils',
]

task('export:abis', 'Export ABIs to a node package')
  .addOptionalParam('previousVersion', 'version of the package to publish')
  .setAction(async ({ previousVersion }, { artifacts }) => {
    const version = semver.inc(previousVersion, 'patch')
    console.log(`Releasing version : ${version}`)

    // get only relevant files
    const allContracts = await artifacts.getAllFullyQualifiedNames()
    const startsWith = (name: string) =>
      ignored.some((ign) => name.startsWith(ign))
    const contractNames = allContracts.filter(
      (qualifiedName) => !startsWith(qualifiedName)
    )

    // get artifacts
    await Promise.all(
      contractNames.map(async (qualifiedName) => {
        const { abi, sourceName, contractName } =
          await artifacts.readArtifact(qualifiedName)

        const toExport = {
          sourceName,
          contractName,
          abi,
        }

        const abiFileName = path.resolve(
          packageFolder,
          'src',
          'abis',
          sourceName.replace('contracts/', ''),
          `${contractName}.json`
        )

        await fs.outputJSON(abiFileName, toExport.abi, { spaces: 2 })
      })
    )

    // create repo files
    await createIndexFile(
      path.resolve(packageFolder, 'src', 'abis'),
      path.resolve(packageFolder, 'src'),
      path.resolve(packageFolder, 'src', 'abis')
    )
  })
