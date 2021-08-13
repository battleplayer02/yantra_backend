#!/usr/bin/env bash

#wifi
#/usr/local/bin/wifi.sh -a auto
#/mnt/sda1/app/app/wifi.sh auto

export TZ=Asia/Kolkata

# export bins
export PATH=/opt/node/bin:/mnt/sda1/app/node/bin:$PATH

# PP
sudo modprobe lp
sudo modprobe ppdev

# start
#TZ=Asia/Kolkata ../electron/electron .
TZ=Asia/Kolkata xterm -geometry 100x100 -bg white -fg black -bw 0 -fn 12x24 -e /mnt/sda1/app/app/xrun.sh
