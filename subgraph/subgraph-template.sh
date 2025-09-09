#!/bin/bash
ENABLE_FUTARCHY_FACTORY=${ENABLE_FUTARCHY_FACTORY:-"false"}
cat <<EOF > subgraph.yaml
specVersion: 1.0.0
indexerHints:
  prune: auto
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: MarketFactory
    network: gnosis
    source:
      abi: MarketFactory
      address: "0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1"
      startBlock: 36404701
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities: []
      abis:
        - name: MarketFactory
          file: ./abis/MarketFactory.json
        - name: Reality
          file: ./abis/Realitiy.json
        - name: MarketView
          file: ./abis/MarketView.json
      eventHandlers:
        - event: NewMarket(indexed address,string,address,bytes32,bytes32,bytes32[])
          handler: handleNewMarket
      file: ./src/market-factory.ts
EOF
if [ "$ENABLE_FUTARCHY_FACTORY" == "true" ]; then
cat <<EOF >> subgraph.yaml 
  - kind: ethereum
    name: FutarchyFactory
    network: gnosis
    source:
      abi: FutarchyFactory
      address: "0x7e1acbb3C118A57E25C5fDcb1bFEae7443DfD1dB"
      startBlock: 37314394
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities: []
      abis:
        - name: FutarchyFactory
          file: ./abis/FutarchyFactory.json
        - name: Reality
          file: ./abis/Realitiy.json
        - name: FutarchyProposal
          file: ./abis/FutarchyProposal.json
      eventHandlers:
        - event: NewProposal(indexed address,string,bytes32,bytes32)
          handler: handleNewProposal
      file: ./src/market-factory.ts
  - kind: ethereum
    name: FutarchyFactoryV2
    network: gnosis
    source:
      abi: FutarchyFactory
      address: "0x7e1acbb3C118A57E25C5fDcb1bFEae7443DfD1dB"
      startBlock: 37314394
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities: []
      abis:
        - name: FutarchyFactory
          file: ./abis/FutarchyFactory.json
        - name: Reality
          file: ./abis/Realitiy.json
        - name: FutarchyProposal
          file: ./abis/FutarchyProposal.json
      eventHandlers:
        - event: NewProposal(indexed address,string,bytes32,bytes32)
          handler: handleNewProposal
      file: ./src/market-factory.ts
  - kind: ethereum
    name: FutarchyFactoryV3
    network: gnosis
    source:
      abi: FutarchyFactory
      address: "0x7e1acbb3C118A57E25C5fDcb1bFEae7443DfD1dB"
      startBlock: 37314394
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities: []
      abis:
        - name: FutarchyFactory
          file: ./abis/FutarchyFactory.json
        - name: Reality
          file: ./abis/Realitiy.json
        - name: FutarchyProposal
          file: ./abis/FutarchyProposal.json
      eventHandlers:
        - event: NewProposal(indexed address,string,bytes32,bytes32)
          handler: handleNewProposal
      file: ./src/market-factory.ts
EOF
fi
cat <<EOF >> subgraph.yaml 
  - kind: ethereum
    name: MarketFactoryFast
    network: gnosis
    source:
      abi: MarketFactory
      address: "0x1246C7E5Ac59BA73A45a62E3081b548F02F58e90"
      startBlock: 41143123
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities: []
      abis:
        - name: MarketFactory
          file: ./abis/MarketFactory.json
        - name: Reality
          file: ./abis/Realitiy.json
        - name: MarketView
          file: ./abis/MarketView.json
      eventHandlers:
        - event: NewMarket(indexed address,string,address,bytes32,bytes32,bytes32[])
          handler: handleNewMarket
      file: ./src/market-factory.ts
  - kind: ethereum
    name: FutarchyFactory
    network: gnosis
    source:
      abi: FutarchyFactory
      address: "0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345"
      startBlock: 38290244
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities: []
      abis:
        - name: FutarchyFactory
          file: ./abis/FutarchyFactory.json
        - name: Reality
          file: ./abis/Realitiy.json
        - name: FutarchyProposal
          file: ./abis/FutarchyProposal.json
      eventHandlers:
        - event: NewProposal(indexed address,string,bytes32,bytes32)
          handler: handleNewProposal
      file: ./src/market-factory.ts
  - kind: ethereum
    name: Reality
    network: gnosis
    source:
      abi: Reality
      address: "0xE78996A233895bE74a66F451f1019cA9734205cc"
      startBlock: 36404701
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      abis:
        - name: Reality
          file: ./abis/Realitiy.json
      entities: []
      eventHandlers:
        - event: LogNewAnswer(bytes32,indexed bytes32,bytes32,indexed
            address,uint256,uint256,bool)
          handler: handleNewAnswer
        - event: LogFinalize(indexed bytes32,indexed bytes32)
          handler: handleFinalize
        - event: LogNotifyOfArbitrationRequest(indexed bytes32,indexed address)
          handler: handleArbitrationRequest
        - event: LogReopenQuestion(indexed bytes32,indexed bytes32)
          handler: handleReopenQuestion
        - event: LogCancelArbitration(indexed bytes32)
          handler: handleCancelArbitration
      file: ./src/reality.ts
  - kind: ethereum
    name: ConditionalTokens
    network: gnosis
    source:
      abi: ConditionalTokens
      address: "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce"
      startBlock: 36404701
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      abis:
        - name: ConditionalTokens
          file: ./abis/ConditionalTokens.json
      entities: []
      eventHandlers:
        - event: PositionSplit(indexed address,address,indexed bytes32,indexed
            bytes32,uint256[],uint256)
          handler: handlePositionSplit
        - event: PositionsMerge(indexed address,address,indexed bytes32,indexed
            bytes32,uint256[],uint256)
          handler: handlePositionsMerge
        - event: PayoutRedemption(indexed address,indexed address,indexed
            bytes32,bytes32,uint256[],uint256)
          handler: handlePayoutRedemption
        - event: ConditionResolution(indexed bytes32,indexed address,indexed
            bytes32,uint256,uint256[])
          handler: handleConditionResolution
      file: ./src/conditional-tokens.ts
  - kind: ethereum
    name: LightGeneralizedTCR
    network: gnosis
    source:
      abi: IEvidence
      address: "0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672"
      startBlock: 36336124
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      abis:
        - name: IEvidence
          file: ./abis/IEvidence.json
      entities: []
      eventHandlers:
        - event: MetaEvidence(indexed uint256,string)
          handler: handleCurateMetaEvidence
      file: ./src/evidence-metadata.ts
  - kind: ethereum
    name: Realitio_v2_1_ArbitratorWithAppeals
    network: gnosis
    source:
      abi: IEvidence
      address: "0x0000000000000000000000000000000000000000"
      startBlock: 36404701
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      abis:
        - name: IEvidence
          file: ./abis/IEvidence.json
      entities: []
      eventHandlers:
        - event: MetaEvidence(indexed uint256,string)
          handler: handleArbitratorMetaEvidence
      file: ./src/evidence-metadata.ts
  - kind: ethereum
    name: RealitioForeignArbitrationProxyWithAppeals
    network: gnosis
    source:
      abi: IEvidence
      address: "0x0000000000000000000000000000000000000000"
      startBlock: 36404701
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      abis:
        - name: IEvidence
          file: ./abis/IEvidence.json
      entities: []
      eventHandlers:
        - event: MetaEvidence(indexed uint256,string)
          handler: handleArbitratorMetaEvidence
      file: ./src/evidence-metadata.ts
  - kind: ethereum
    name: RealitioForeignProxyOptimism
    network: gnosis
    source:
      abi: IEvidence
      address: "0x0000000000000000000000000000000000000000"
      startBlock: 36404701
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      abis:
        - name: IEvidence
          file: ./abis/IEvidence.json
      entities: []
      eventHandlers:
        - event: MetaEvidence(indexed uint256,string)
          handler: handleArbitratorMetaEvidence
      file: ./src/evidence-metadata.ts
EOF
