# Relay Pool ABIs

Contains all ABIs for Realy Pool contracts.

## Usage

```js
import { RelayPool } from '@relay-protocol/abis'

// import all the ABIs
import * as RelayProtocolAbis from '@relay-protocol/abis'
```

## How it works

This package is generated directly from the `smart-contracts` folder at build time.

The `yarn build` command contains two parts:

```
# export the ABIs to the `src` folder - with generated `index.ts` file
yarn workspace @relay-protocol/smart-contracts build

# build the abis package
yarn build:ts
```

Make sure you update the version in `package.json` and then publish:

```
npm login
npm publish --access public
```
