// helper to generate index.ts for ABIs
import path from 'path'
import { createIndexFile } from '../src/package'

const main = async () => {
  console.log('Building ABIs index...')
  await createIndexFile(
    'abis', // src
    path.resolve('src', 'abis') // dest
  )
}

main()
  .then(() => {
    console.log('ABIs index built successfully!')
  })
  .catch((e) => console.error(e))
