#!/bin/bash

scenespath=$(pwd)
scenespath=$(pwd)/packages/scenes
scenesapppath=$(pwd)/packages/scenes-app

yarn install

cd $scenespath
yarn install
yarn build

cd $scenesapppath
docker compose up -d --build

cd $scenesapppath
echo "Demo app: Compiling..."
yarn dev

