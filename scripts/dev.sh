#!/bin/bash
cleanup() {
    cd $scenespath
    # have to use `npm pkg delete` instead of `yarn remove` else it will remove it from peerDeps as well
    npm pkg delete devDependencies.@grafana/runtime devDependencies.@grafana/data devDependencies.@grafana/ui devDependencies.@grafana/schema devDependencies.@grafana/e2e-selectors
    cd $rootpath
    yarn install
}
trap cleanup SIGINT SIGTERM
set -e

if [[ -z "${GRAFANA_PATH}" ]]; then
    echo "Set GRAFANA_PATH env variable first"
fi

rootpath=$(pwd)
scenespath=$(pwd)/packages/scenes

echo $scenespath

cd $rootpath
# have to manually add a link here instead of using `yarn link` because it errors with peerDep conflicts
yarn workspace @grafana/scenes add -D '@grafana/runtime'@link:$GRAFANA_PATH/packages/grafana-runtime
yarn workspace @grafana/scenes add -D '@grafana/data'@link:$GRAFANA_PATH/packages/grafana-data
yarn workspace @grafana/scenes add -D '@grafana/ui'@link:$GRAFANA_PATH/packages/grafana-ui
yarn workspace @grafana/scenes add -D '@grafana/schema'@link:$GRAFANA_PATH/packages/grafana-schema
yarn workspace @grafana/scenes add -D '@grafana/e2e-selectors'@link:$GRAFANA_PATH/packages/grafana-e2e-selectors

yarn install

cd $GRAFANA_PATH
yarn add '@grafana/scenes'@link:$scenespath
clear
cd $scenespath
echo "@grafana/scenes: linked to Grafana repo. Start Grafana now."
echo "@grafana/scenes: Compiling..."
yarn dev
