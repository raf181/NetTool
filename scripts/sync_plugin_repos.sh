#!/usr/bin/env bash
set -euo pipefail

# Script to clone or update plugin repositories defined in app/plugins/plugins/*/plugin.json.
PYTHON_BIN="$(command -v python3 || command -v python || true)"

if [[ -z "$PYTHON_BIN" ]]; then
    echo "Python is required to parse plugin manifests." >&2
    exit 1
fi


ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_DIR="$ROOT_DIR/app/plugins/plugins"

declare -A PLUGIN_REPOS=(
    [arp_manager]="https://github.com/NetScout-Go/Plugin_arp_manager"
    [bandwidth_test]="https://github.com/NetScout-Go/Plugin_bandwidth_test"
    [ble_http_proxy]="https://github.com/NetScout-Go/Plugin_ble_http_proxy"
    [device_discovery]="https://github.com/NetScout-Go/Plugin_device_discovery"
    [dns_lookup]="https://github.com/NetScout-Go/Plugin_dns_lookup"
    [dns_propagation]="https://github.com/NetScout-Go/Plugin_dns_propagation"
    [example]="https://github.com/NetScout-Go/Plugin_example"
    [external_plugin]="https://github.com/NetScout-Go/Plugin_external_plugin"
    [iperf3]="https://github.com/NetScout-Go/Plugin_iperf3"
    [iperf3_server]="https://github.com/NetScout-Go/Plugin_iperf3_server"
    [mtu_tester]="https://github.com/NetScout-Go/Plugin_mtu_tester"
    [network_info]="https://github.com/NetScout-Go/Plugin_network_info"
    [network_latency_heatmap]="https://github.com/NetScout-Go/Plugin_network_latency_heatmap"
    [network_quality]="https://github.com/NetScout-Go/Plugin_network_quality"
    [packet_capture]="https://github.com/NetScout-Go/Plugin_packet_capture"
    [ping]="https://github.com/NetScout-Go/Plugin_ping"
    [port_scanner]="https://github.com/NetScout-Go/Plugin_port_scanner"
    [reverse_dns_lookup]="https://github.com/NetScout-Go/Plugin_reverse_dns_lookup"
    [ssl_checker]="https://github.com/NetScout-Go/Plugin_ssl_checker"
    [subnet_calculator]="https://github.com/NetScout-Go/Plugin_subnet_calculator"
    [tc_controller]="https://github.com/NetScout-Go/Plugin_tc_controller"
    [traceroute]="https://github.com/NetScout-Go/Plugin_traceroute"
    [wifi_device_locator]="https://github.com/NetScout-Go/Plugin_wifi_device_locator"
    [wifi_device_proximity]="https://github.com/NetScout-Go/Plugin_wifi_device_proximity"
    [wifi_scanner]="https://github.com/NetScout-Go/Plugin_wifi_scanner"
)

if [[ ! -d "$PLUGIN_DIR" ]]; then
    echo "Plugin directory not found: $PLUGIN_DIR" >&2
    exit 1
fi

shopt -s nullglob
manifests=("$PLUGIN_DIR"/*/plugin.json)
shopt -u nullglob

declare -A processed=()

for manifest in "${manifests[@]}"; do
    plugin_path="$(dirname "$manifest")"
    plugin_id="$(basename "$plugin_path")"

    repo_url="$($PYTHON_BIN -c 'import json, sys; import pathlib; manifest_path = pathlib.Path(sys.argv[1]); data = json.load(manifest_path.open()); print(data.get("repository", ""))' "$manifest")"

    if [[ -z "$repo_url" ]]; then
        echo "Skipping $plugin_id: repository field missing" >&2
        continue
    fi

    processed["$plugin_id"]=1

    if [[ -d "$plugin_path/.git" ]]; then
        echo "Updating existing plugin repo: $plugin_id"
        git -C "$plugin_path" fetch --prune
        git -C "$plugin_path" pull --ff-only
        continue
    fi

    if [[ -d "$plugin_path" && -n "$(ls -A "$plugin_path" 2>/dev/null)" ]]; then
        backup_path="${plugin_path}_backup_$(date +%Y%m%d%H%M%S)"
        echo "Backing up current $plugin_id contents to $backup_path"
        mv "$plugin_path" "$backup_path"
    fi

    echo "Cloning $repo_url into $plugin_path"
    git clone "$repo_url" "$plugin_path" || {
        echo "Failed to clone $repo_url" >&2
        continue
    }

done

for plugin_id in "${!PLUGIN_REPOS[@]}"; do
    if [[ -n "${processed[$plugin_id]:-}" ]]; then
        continue
    fi

    plugin_path="$PLUGIN_DIR/$plugin_id"
    repo_url="${PLUGIN_REPOS[$plugin_id]}"

    if [[ -d "$plugin_path/.git" ]]; then
        echo "Updating existing plugin repo: $plugin_id"
        git -C "$plugin_path" fetch --prune
        git -C "$plugin_path" pull --ff-only
        continue
    fi

    if [[ -d "$plugin_path" && -n "$(ls -A "$plugin_path" 2>/dev/null)" ]]; then
        backup_path="${plugin_path}_backup_$(date +%Y%m%d%H%M%S)"
        echo "Backing up current $plugin_id contents to $backup_path"
        mv "$plugin_path" "$backup_path"
    fi

    echo "Cloning $repo_url into $plugin_path"
    git clone "$repo_url" "$plugin_path" || {
        echo "Failed to clone $repo_url" >&2
        continue
    }
done

echo "Plugin synchronization complete."
