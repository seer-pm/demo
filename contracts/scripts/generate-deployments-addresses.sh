#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
DEPLOYMENTS_DIR="$SCRIPT_DIR/../deployments"

# Optional format: "markdown" (default) or "json"
FORMAT="${1:-markdown}"

IGNORED_ARTIFACTS=(
    "CollateralToken.json"
    "ConditionalTokens*"
    "LightGeneralizedTCR.json"
    "RealitioHomeArbitrationProxy.json"
    "Reality.json"
    "CreditsManager.json"
    "GovernedRecipient.json"
    "LiquidityManager.json"
    "MultiDrop.json"
    "SavingsXDai.json"
    "SeerCredits.json"
    "UniswapV2Router02.json"
    "RealitioForeignProxyOptimism.json"
    "RealitioForeignProxyBase.json"
    "RealitioForeignArbitrationProxyWithAppeals.json"
)

# Networks: name (for markdown title), deployment dir, explorer URL
NETWORKS=(
    "Gnosis:gnosis:https://gnosisscan.io/address/"
    "Ethereum:ethereum:https://etherscan.io/address/"
    "Optimism:optimism:https://optimistic.etherscan.io/address/"
    "Base:base:https://basescan.org/address/"
)

function list_contract_files() {
    local deploymentDir=$1
    ls -1 "$deploymentDir"/*.json 2>/dev/null | grep -v ${IGNORED_ARTIFACTS[@]/#/-e } | sort
}

function generate_markdown() {
    local deploymentDir=$1
    local explorerUrl=$2
    echo "| Contract | Address |"
    echo "|----------|---------|"
    for f in $(list_contract_files "$deploymentDir"); do
        contractName=$(basename "$f" .json)
        address=$(jq -r .address "$f")
        implementation=$(jq -r .implementation "$f")

        if [ "$implementation" != "null" ] && [ -n "$implementation" ]; then
            echo "| $contractName (proxy) | [$address]($explorerUrl$address), [implementation]($explorerUrl$implementation) |"
        else
            echo "| $contractName | [$address]($explorerUrl$address) |"
        fi
    done
}

function contracts_to_json_object() {
    local deploymentDir=$1
    local obj="{}"
    for f in $(list_contract_files "$deploymentDir"); do
        contractName=$(basename "$f" .json)
        address=$(jq -r .address "$f")
        obj=$(echo "$obj" | jq --arg n "$contractName" --arg a "$address" '. + {($n): $a}')
    done
    echo "$obj"
}

function output_markdown() {
    for entry in "${NETWORKS[@]}"; do
        IFS=: read -r name dir_name explorerUrl <<< "$entry"
        deploymentDir="$DEPLOYMENTS_DIR/$dir_name"
        echo "### $name"
        echo
        generate_markdown "$deploymentDir" "$explorerUrl"
        echo ""
    done
}

function output_json() {
    local result="{}"
    for entry in "${NETWORKS[@]}"; do
        IFS=: read -r name dir_name explorerUrl <<< "$entry"
        deploymentDir="$DEPLOYMENTS_DIR/$dir_name"
        chainIdFile="$deploymentDir/.chainId"
        if [ ! -f "$chainIdFile" ]; then
            echo "Warning: $chainIdFile not found, skipping $name" >&2
            continue
        fi
        chainId=$(cat "$chainIdFile")
        contracts=$(contracts_to_json_object "$deploymentDir")
        result=$(echo "$result" | jq --arg id "$chainId" --argjson c "$contracts" '. + {($id): $c}')
    done
    echo "$result"
}

case "$FORMAT" in
    markdown|md)
        output_markdown
        ;;
    json)
        output_json
        ;;
    *)
        echo "Usage: $0 [format]" >&2
        echo "  format: markdown (default) or json" >&2
        exit 1
        ;;
esac