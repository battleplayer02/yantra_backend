#!/usr/bin/env bash

echo "[SETUP UTILITY FOR LOTTO YANTRA] Initializing..."

# env variables
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV="development"
fi
echo "[SETUP UTILITY FOR LOTTO YANTRA] Using environment: $NODE_ENV"

# npm install command for root deps.
npm i

# install in sub-systems
subdeps=( "./src/node/service-yantra-admin/ks" "./src/node/service-yantra-admin" "./src/node/service-stockist-admin/ks" "./src/node/service-stockist-admin" )
for DEP in "${subdeps[@]}"
do
	echo "[SETUP UTILITY FOR  LOTTO YANTRA] Installing dep: $DEP"
	cd $DEP
    npm i
    cd -
done

