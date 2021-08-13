#!/usr/bin/env bash


# create dirs
echo "Cleaning old authoring_tool builds..."
rm -rf ../../../dist/main-app
#mkdir -p ../dist/main-app/x64
#mkdir -p ../dist/main-app/mac

#electron-packager ./ --platform=win32,darwin,linux --arch=x64 --overwrite --asar --out=../dist/main-app/
electron-packager ./ --platform=darwin --arch=x64 --overwrite --asar --out=../../../dist/main-app/
electron-packager ./ --platform=linux --arch=ia32 --overwrite --asar --out=../../../dist/main-app/
electron-packager ./ --platform=linux --arch=ia32 --overwrite --out=../../../dist/main-app/

