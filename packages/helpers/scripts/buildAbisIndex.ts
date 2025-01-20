// helper to generate index.ts for ABIs
import { createIndexFile } from '../src/package';

const main = async () => {
  await createIndexFile('abis');
};

main()
  .then(() => console.log('ok.'))
  .catch((e) => console.error(e));
