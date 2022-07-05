# on-chain-owners

# MATIC ERC1155 RAFFLE

Run new raffle command:

`yarn dev raffle <BLOCK_NUMBER> <raffle-ids>` 

NOTE: We are validating the raffleId exists and sorting raffleIdsList prior to making a subgraph query. 

Example command:

``` yarn dev raffle 29549404 "1,2,3,4,5" ```

``` yarn dev raffle 29549404 "5,2,3,4,1" ```
