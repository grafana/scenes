#!/bin/bash

yarn install
yarn build

docker compose -f packages/scenes-app/docker-compose.yaml up -d --build

yarn dev

