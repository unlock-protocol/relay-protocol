# payday-pools

## Deploy contracts

```
# export your private key to the shell
export DEPLOYER_PRIVATE_KEY=...

# Deploy a bridge proxy on an L2
yarn hardhat deploy:bridge-proxy --network op-sepolia

# Deploy a relay bridge on an L2
yarn hardhat deploy:relay-bridge --network op-sepolia --proxy-bridge 0x34EbEc0AE80A2d078DE5489f0f5cAa4d3aaEA355 (address from previous step!)

# Deploy a bridge proxy on an L1
yarn hardhat deploy:bridge-proxy --network sepolia

# Optional on testnets: you may want to deploy a yield pool (here we use WETH as the asset):
yarn hardhat deploy:dummy-yield-pool --network sepolia --asset 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9

# Deploy a relay pool on the L1 (here we use WETH as the asset):
(you may need to manually update the deployment script to include the correct values for the origin)
yarn hardhat deploy:pool --network sepolia --asset 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9 --yield-pool 0x3FEB26d09420Bfdbb0E2F6Cf4777aFf0bd7e7953 (you can use the yield pool address from the previous step, or an existing AAVE, Morpho... etc pool)
```

You can also use Hardhat Ignition directly

```
# 1. build per network file with params
yarn hardhat run scripts/ignitionParams.ts

# 2. deploy contract
yarn hardhat ignition deploy ignition/modules/CCTPBridgeProxyModule.ts --parameters ignition/params/1.json --network optimism
```

## Verify contracts

Using deployment ids found in `ignition/deployments` folder

```
# example
yarn hardhat ignition verify RelayPool-USDC-REL-11155111
```

## Interacting

Once the contracts have been deployed you can start to use them.
First, you need to add liquidity to the pool (you may need to ERC20 approve the newly created prool before issuing a `deposit`). (amount in wei)

```
yarn hardhat pool:deposit --network sepolia --pool 0xFf7c09b2aeC469E0D11Be84B84Ef30E2f3147B52 --amount 1000000000000
```

Then you can use the `bridge` function on the Relay Bridge contract! Make sure you initiate a bridge with _less_ than the amount in the pool. (amount in wei)

```
yarn hardhat bridge:send --network op-sepolia --bridge 0xd0b14797b9D08493392865647384974470202A78 --dest-chain 11155111 --pool 0xFf7c09b2aeC469E0D11Be84B84Ef30E2f3147B52 --amount 10000
```
