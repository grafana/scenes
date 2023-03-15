#!/bin/bash
if [[ -z "${GRAFANA_PATH}" ]]; then
    echo "Set GRAFANA_PATH env variable first"
fi

scenespwd=$(pwd)

yarn install

cd $GRAFANA_PATH
yarn add '@grafana/scenes'@portal:$scenespwd 
clear
cd $scenespwd
echo "@grafana/scenes: linked to Grafana repo. Start Grafana now."
echo "@grafana/scenes: Compiling..."
yarn dev