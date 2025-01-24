# payday-pools

## Contracts used for Relay Vaults & Bridges:

### RelayPool

- RelayPool let Liquidity Providers (LP) deposit and withdraw a specific asset and receive yield for their deposit. The RelayPool contracts do _not_ hold the liquidity themselves and just "forward" the funds to a "base yield" contract (Aave, Morpho... etc). They also implement a `handle` function and a `claim` function which are respectively used to "loan" funds to another user who has initiated a "fast" withdrawal from an L2 contract, as well as claim the funds once they have effectively crossed the bridge.
- RelayPool aimed at being deployed on L1 (ethereum mainnet) for a specific asset (wrapped ETH, or other ERC20s) and can handle funds coming from multiple sources, as long as it is the same asset. Each origin has its own `BridgeProxy` contract that implements the specific claim for a given L2/Bridge.
- The `handle` function is called by Hyperlane to indicate that a user has initiated an L2->L1 withdrawal and that the user can receive funds (minus fees), since the RelayPool has insurance that the funds will eventually be transfered.
- RelayPools are deployed thru a `RelayPoolFactory` for convenience. When a pool uses wrapped ETH, we offer a `RelayPoolNativeGateway` which lets users deposit ETH directly without the need to wrap.
- RelayPools have a curator which is an address that can perform configuration changes (adding new origins, updating the bridge fee, or even chamging the "base yield" contract). It is possible for an attacker to steal funds from LP, which is why it is critical that this address points to a timelock contract (LPs could withdraw their funds before a malicious transaction is submitted). This timelock should itself receive its operations from a multi-sig, or even a governor contract that uses the RelayVault shares to let LP collectively govern the pool if needed.

### RelayBridge

RelayBridge contracts let solvers (or other users) initiate a withdrwal from an L2 to the L1. They are asset-specific. They also call a L2/Bridge specific `BridgeProxy` in order to initiate the withdrwal. When called, the issue both an Hyperlane message and a bridge withdrwal.

### ProxyBridge contracts

The actual bridging logic is abstracted away and implemented in various ProxyBridge contracts for the OPStack, Arbitrum Orbit and others. It is in theory possible to create these bridges for any bridge (native or not).

## Deploy contracts

For all deployments you need a private key:

```
# export your private key to the shell
export DEPLOYER_PRIVATE_KEY=...
```

1. Deploy the factories

The factories are not strictly necessary for the protocol to operator but they provide convenience to identify deployed contracts. There addresses are added to the `../backend` application.
You should not have to deploy factories.

When deploying to a network, make sure you first add the network details in the package `../packages/network` and run `yarn build`.

```
# Bridge factory (deployed on L2)
yarn run hardhat deploy:bridge-factory --network op-sepolia

# Pool factory (deployed on L1)
yarn run hardhat deploy:pool-factory --network sepolia
```

Note: You can verify the pools with a command like

```
yarn run hardhat ignition verify <name of deployment from ignition/deployments/>
```

2. Deploy protocol contracts

2.1 Deploy a bridge on an L2

We start with it because we need to provide "origin" addresses on the L1 pool when we will deploy it.

```
# Deploy a bridge proxy on an L2: here we should OP-sepolia, of type op and sending funds to Sepolia (11155111)
yarn hardhat deploy:bridge-proxy --network op-sepolia

# Deploy a relay bridge on the same L2
yarn hardhat deploy:relay-bridge --network op-sepolia
```

2.2 Deploy the pool on the L1

```
# Deploy a bridge proxy on an L1
yarn hardhat deploy:bridge-proxy --network sepolia

# Optional on test networks: you may want to deploy a yield pool (here we use WETH as the asset):
yarn hardhat deploy:dummy-yield-pool --network sepolia --asset 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9

# Deploy a relay pool on the L1 (here we use WETH as the asset):
# For `yield-pool` you can use the yield pool address from the previous step, or an existing AAVE, Morpho... etc
# For `origins` you need a stringified JSON object that includes the chainId (L2), bridge contract (L2), max debt from that bridge and the L1 proxy bridge.

yarn hardhat deploy:pool \
  --network sepolia \
  --factory 0xF06fB9fBC957e99D4B527B0a73a894A483EA1c46 \
  --asset 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9 \
  --yield-pool 0x3FEB26d09420Bfdbb0E2F6Cf4777aFf0bd7e7953 \
  --origins '[{
      "chainId": 11155420,
      "bridge": "0xD7d4F627C80908Ef9fa70a40E671b155B1A3595f",
      "maxDebt": 1000000000000,
      "proxyBridge": "0x22CfA4db4eB5d67D3C022206545A45d1554A8A40"
    },{
      "chainId": 421614,
      "bridge": "0xF241F12506fb6Bf1909c6bC176A199166414007a",
      "maxDebt": 1000000000000,
      "proxyBridge": "0xbb3cd7ced6a8d6efda6c1e549a3ca0431390566a"
    }]'
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
