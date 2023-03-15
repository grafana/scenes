#!/bin/bash
if [[ -z "${GRAFANA_PATH}" ]]; then
    echo "Set GRAFANA_PATH env variable first"
fi

scenespath=$(pwd)
scenespath=$(pwd)/packages/scenes

echo $scenespath
yarn install

cd $GRAFANA_PATH
yarn add '@grafana/scenes'@portal:$scenespath 
clear
cd $scenespath
echo "@grafana/scenes: linked to Grafana repo. Start Grafana now."
echo "@grafana/scenes: Compiling..."
yarn dev