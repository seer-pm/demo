#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

IGNORED_ARTIFACTS=(
    "CollateralToken.json"
    "ConditionalTokens*"
    "LightGeneralizedTCR.json"
    "RealitioHomeArbitrationProxy.json"
    "Reality.json"
)

function generate() { #deploymentDir #explorerUrl
    deploymentDir=$1
    explorerUrl=$2
    for f in $(ls -1 $deploymentDir/*.json 2>/dev/null | grep -v ${IGNORED_ARTIFACTS[@]/#/-e } | sort); do
        contractName=$(basename $f .json)
        address=$(cat $f | jq -r .address)
        implementation=$(cat $f | jq -r .implementation)

        if [ "$implementation" != "null" ]; then
            echo "- [$contractName: proxy]($explorerUrl$address), [implementation]($explorerUrl$implementation)"
        else
            echo "- [$contractName]($explorerUrl$address)"
        fi
    done
}

echo "### Gnosis"
echo
generate "$SCRIPT_DIR/../deployments/gnosis" "https://gnosisscan.io/address/"

echo "### Ethereum"
echo
generate "$SCRIPT_DIR/../deployments/ethereum" "https://etherscan.io/address/"