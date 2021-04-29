# Wrap statistics

This project watch for Tezos, Ethereum and IPFS to build statistics about the $WRAP protocol.

It watches :
- ERC20/ERC721 locks on Ethereum side
- Quorum configuration
- Quorum signers activity on IPFS
- FA2 Tokens minting on Tezos side

# Build and run

yarn lint
yarn build
node build/src/index.js

# API

You can access a json http api on http://localhost:3000/[api_version]
Current api version is "v1"

## Endpoint http://localhost:3000/v1/locks

Exposes :
- ethereumSymbol = Ethereum token symbol, ie : LINK
- token = Ethereum token address, ie : 0x514910771af9ca656af840dff83e8264ecf986ca
- lockCount = total unique lock contract calls
- tokenVolume = total number of tokens that was locked on the contract
- lockUsdTotalValue = Total locked usd value at the time of the lock. For each lock, the notional value of has been recorded at the time of the transaction. 
- currentUsdTotalValue = Total locked current usd value

This endpoint accepts query filters on :
- ethereumFrom
- token
- ethereumSymbol
- tezosTo