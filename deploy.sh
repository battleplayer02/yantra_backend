#!/bin/sh

########################
# Ensure Env vars. Allow overrides.
########################
if [ -z "$DEPLOY_BRANCH" ]; then
    export DEPLOY_BRANCH=$GIT_BRANCH
fi
if [ -z "$DEPLOY_BRANCH" ]; then
    export DEPLOY_BRANCH="master"
fi
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV="production"
fi
if [ -z "$APP_NAME" ]; then
    export APP_NAME="lottoyantra"
fi

########################
# Go to required Dir
########################
echo "[DEPLOY] Deployment initiated... $DEPLOY_BRANCH | $NODE_ENV";
cd
cd demo-yantar

########################
# Fetch latest code from git
########################
echo "[DEPLOY] Updating sources..."
#git fetch
#git branch $DEPLOY_BRANCH origin/$DEPLOY_BRANCH
#git checkout $DEPLOY_BRANCH
git pull origin $DEPLOY_BRANCH

########################
# Build
########################
echo "[DEPLOY] Building packages..."
#./build-web.sh

########################
# Kill old running processes
########################
echo "[DEPLOY] Killing the running process"
kill $(ps aux | grep $APP_NAME | awk '{print $2}') || true

########################
# Start new processes
########################
echo "[DEPLOY] Running the application"
PORT=9191 nohup npm run prod `echo $APP_NAME` >> ~/node.out 2>&1&
# back to home
cd
