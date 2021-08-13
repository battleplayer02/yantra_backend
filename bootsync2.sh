#!/bin/sh
# put other system startup commands here, the boot process will wait until they complete.
# Use bootlocal.sh for system startup commands that can run in the background
# and therefore not slow down the boot process.

TARGET=/dev/sda
out() {
 sync; sync
 poweroff
}

pause() {
    sleep 5
}


#########################
devices() {
  find /sys/block/*/ -name dev |
  grep -Ev '\/(ram|ramzswap|loop|zram|sr)[0-9][0-9]*\/'| tr [!] [/] |
  awk -v rlist="$REMOVABLES" '
  BEGIN {FS="/"}
  {
    d = $(NF-1)
    printf "%s",d
    if (index(rlist,substr(d,1,3)) != 0 ) printf "\tOn a removable device."
    printf "\n"
  }'
}

# Main
REMOVABLES=$(dmesg | grep "removable disk" | cut -d : -f 5- | awk '{print $1}' | tr -d "[]")

[ -z "$1" ] && devices

while getopts pd OPTION
do
  case ${OPTION} in
    p|P) devices | grep -E '^[a-z][a-z][a-z][0-9][0-9]*|^mmcblk[0-9]p[0-9][0-9]*' ;;
    d|D) devices | grep -Ev '^[a-z][a-z][a-z][0-9][0-9]*|^mmcblk[0-9]p[0-9][0-9]*' ;;
    *) devices
  esac
done




# Command Line, proc might not be mounted
[ -f /proc/cmdline ] || /bin/mount /proc
CMDLINE=""; CMDLINE=" $(cat /proc/cmdline)"
# ANSI COLORS
CRE="$(echo -e '\r\033[K')"
RED="$(echo -e '\033[1;31m')"
GREEN="$(echo -e '\033[1;32m')"
YELLOW="$(echo -e '\033[1;33m')"
BLUE="$(echo -e '\033[1;34m')"
MAGENTA="$(echo -e '\033[1;35m')"
CYAN="$(echo -e '\033[1;36m')"
WHITE="$(echo -e '\033[1;37m')"
NORMAL="$(echo -e '\033[0;39m')"

ar() {
    busybox ar "$@"
}

awk() {
    busybox awk "$@"
}

cat() {
    busybox cat "$@"
}

clear() {
    busybox clear "$@"
}

cp() {
    busybox cp "$@"
}

cpio() {
    busybox cpio "$@"
}

dc() {
    busybox dc "$@"
}

df() {
    busybox df "$@"
}

du() {
    busybox du "$@"
}

depmod() {
    busybox depmod "$@"
}

expr() {
    busybox expr "$@"
}

fdisk() {
    busybox fdisk "$@"
}

fold() {
    busybox fold "$@"
}

grep() {
    busybox grep "$@"
}

gunzip() {
    busybox gunzip "$@"
}

hostname() {
    busybox hostname "$@"
}

kill() {
    busybox kill "$@"
}

killall() {
    busybox killall "$@"
}

ls() {
    busybox ls "$@"
}

md5sum() {
    busybox md5sum "$@"
}

mount() {
    busybox.suid mount "$@"
}

sed() {
    busybox sed "$@"
}

sort() {
    busybox sort "$@"
}

swapoff() {
    busybox swapoff "$@"
}

swapon() {
    busybox swapon "$@"
}

sync() {
    busybox sync "$@"
}

tar() {
    busybox tar "$@"
}

umount() {
    busybox.suid umount "$@"
}

wc() {
    busybox wc "$@"
}

wget() {
    busybox wget "$@"
}


trim() { echo $1; }

stringinfile(){
case "$(cat $2)" in *$1*) return 0;; esac
return 1
}

stringinstring(){
case "$2" in *$1*) return 0;; esac
return 1
}

getbootparam(){
stringinstring " $1=" "$CMDLINE" || return 1
result="${CMDLINE##* $1=}"
result="${result%%[ 	]*}"
echo "$result"
return 0
}

getparam(){
stringinstring " $1=" "$2" || return 1
result="${2##*$1=}"
result="${result%%[ 	]*}"
echo "$result"
return 0
}

checkbootparam(){
stringinstring " $1" "$CMDLINE"
return "$?"
}

getbasefile(){
echo -e "${1##*/}"|awk -v n="$2" '{for (i=n; i>0; i--) sub(/\.[^\.]*$/, ""); print;}'
return 0
}

mounted(){
grep $1 /etc/mtab >/dev/null 2>&1
if [ $? == 0 ]; then return 0; fi
return 1
}

find_mountpoint() {
 MOUNTPOINT=""
 MOUNTED="no"
 D2="$1"
 if [ "$D2" == "nfs" ]; then
    MOUNTPOINT=/mnt/nfs
    MOUNTED="yes"
    return
 fi
 if [ "${D2:0:5}" == "UUID=" ]; then
   D2=`/sbin/blkid -lt $D2 -o device`
   if [ "$?" != 0 ]; then
     MOUNTPOINT=""
     return
   else
     D2="${D2%%:*}"
   fi
 elif [ "${D2:0:6}" == "LABEL=" ]; then
   D2=`/sbin/blkid -lt $D2 -o device`
   if [ "$?" != 0 ]; then
     MOUNTPOINT=""
     return
   else
     D2="${D2%%:*}"
   fi
 else
   D2=/dev/$D2
 fi
 MOUNTPOINT="$(grep -i ^$D2\  /etc/mtab|awk '{print $2}'|head -n 1)"
 if [ -n "$MOUNTPOINT" ]; then
   MOUNTED="yes"
   return
 fi

# Special case for virtual disk
 if [ "$D2" == "/dev/tcvd" ]; then
   MOUNTPOINT="$(awk '/\/mnt\/tcvd/{print $2}' /etc/mtab|head -n 1)"
   if [ -n "$MOUNTPOINT" ]; then
     MOUNTED="yes"
     return
   fi
 fi

 MOUNTPOINT="$(grep -i ^$D2\  /etc/fstab|awk '{print $2}'|head -n 1)"
}

autoscan(){
FOUND=""
for DEVICE in `autoscan-devices`; do
   find_mountpoint $DEVICE
   if [ -n "$MOUNTPOINT" ]; then
     if [ "$MOUNTED" == "no" ]; then
       mount "$MOUNTPOINT" >/dev/null 2>&1
     fi
     if [ "-$2" "$MOUNTPOINT"/$1 ]; then
       FOUND="yes"
     fi
     if [ "$MOUNTED" == "no" ]; then
       umount "$MOUNTPOINT" >/dev/null 2>&1
     fi
     if [ -n "$FOUND" ]; then
       echo "$DEVICE"
       return 0
     fi
   fi
done
DEVICE=""
return 1
}

getpasswd(){
  readpassword(){
    PASSWD=""
    until [ ${#PASSWD} -ge 8 ] && [ ${#PASSWD} -le 56 ]; do
      PASSWD=""
      if [ "$2" == "confirm" ]; then
        echo
        echo -n "${BLUE} Re-enter${NORMAL}: "
      else
        echo -n "${BLUE}Enter password (8 to 56 characters) for ${YELLOW}$1${NORMAL}: "
      fi
      read -s PASSWD
      [ ${#PASSWD} -lt 8 ] && echo " Password is too short!"
      [ ${#PASSWD} -gt 56 ] && echo " Password is too long!"
    done
  }
  OK=0
  until [ "$OK" == 1 ]; do
    readpassword $1
    PASSWD1=$PASSWD
    readpassword $1 confirm
    if [ "$PASSWD1" == "$PASSWD" ]; then
      OK=1
      echo " ${GREEN}Accepted.${NORMAL}"
    else
      echo " ${RED}Mismatch.${NORMAL}"
    fi
  done
  return 0
}

status() {
  local CHECK=$?
  echo -en "\\033[70G[ "
  if [ $CHECK = 0 ]; then
    echo -en "\\033[1;33mOK"
  else
    echo -en "\\033[1;31mFailed"
  fi
  echo -e "\\033[0;39m ]"
}

usleep_progress() {
# Wait 2 seconds
  CHAR='.'
  for i in `seq 1 79`
  do
    echo -n "$CHAR"
    usleep 25316
  done
  echo "$CHAR"
}

checkroot() {
 if [ `/usr/bin/id -u` -ne 0 ]; then
   echo "Need root privileges." >&2
   exit 1
 fi
}

checknotroot() {
 if [ `/usr/bin/id -u` -eq 0 ]; then
   echo "Don't run this as root." >&2
   exit 1
 fi
}

checkX() {
 if [ -z ${DISPLAY} ]; then
   echo "Requires X windows." >&2
   exit 1
 fi
}

setupHome(){
   read USER < /etc/sysconfig/tcuser
   if [ ! -d /home/"$USER" ] || [ "`ls -la /home/${USER} | wc -l`" -le 3 ]
   then
      mkdir -p /home/"$USER"/.X.d
      mkdir -p /home/"$USER"/.local/bin
      chown -R "$USER".staff /home/"$USER/"
      chmod -R g+s,o-rwx /home/"$USER/"
   fi
   LIST=`mktemp`
   > "$LIST"
   for S in `find /etc/skel -type f`
   do
	ITEM="${S#/etc/skel/}"
	if [ ! -e /home/"$USER"/"$ITEM" ]
	then
		echo "$ITEM" >> "$LIST"
	fi
   done
   if [ -s "$LIST" ]
   then
      tar -C /etc/skel -T "$LIST" -cf - | tar -C /home/"$USER" -xf -
      while read ITEM
	do chown -R "$USER".staff /home/"$USER"/"${ITEM%%/*}"
      done < "$LIST"
   fi
   rm "$LIST" 2>/dev/null
}

merge() {
awk -v mergedata="$1" -v target="$3" '
{
  if ( index($0,target) )
  {
     while (( getline item < mergedata ) > 0 )
       print item
     close(mergedata)
  }
  print $0
} ' "$2"
}

replace() {
awk -v mergedata="$1" -v target="$3" '
{
  if ( index($0,target) )
  {
     while (( getline item < mergedata ) > 0 )
       print item
     close(mergedata)
  } else print $0
} ' "$2"
}

purge(){
awk -v startTarget="$2" -v endTarget="$3" '
BEGIN { writeFlag=1 }
{
  if (index($0, startTarget))
  {
    print $0
    writeFlag=0
  } else
    if (index($0, endTarget)) writeFlag=1

  if (writeFlag) print $0
} ' "$1"
}

getMajorVer() {
awk '{printf "%d", $1}' /usr/share/doc/tc/release.txt
}


getBuild() {
BUILD=`uname -m`
case ${BUILD} in
	armv6l) echo "armv6" ;;
	armv7l) echo "armv7" ;;
	i686)   echo "x86" ;;
	x86_64) [ -f /lib/ld-linux-x86-64.so.2 ] && echo "x86_64" || echo "x86" ;;
	*)      echo "x86" ;;
esac
}

getMirror() {
BUILD="$1"
[ -z "$BUILD" ] && BUILD=$(getBuild)
read MIRROR < /opt/tcemirror
#MIRROR="${MIRROR%/}/$(getMajorVer).x/x86/tcz"
MIRROR="${MIRROR%/}/$(getMajorVer).x/$BUILD/tcz"
}

installed() {
  if [ -e /usr/local/tce.installed/${1%.*} ]; then
    return 0
  else
    return 1
  fi
}

getKeyEventDevice() {
e=0
for i in /sys/class/input/input*/name; do
  if grep -q "eyboard" $i; then break; fi
  e=`busybox expr "$e" + 1`
done
[ $e -gt 0 ] || exit 1
echo /dev/input/event$e
}

parentOf()
{
	PID=$(pidof $1) || return
	PPID=$(awk '/^PPid:/{print $2}' /proc/$PID/status)
	awk '/^Name:/{print $2}' /proc/$PPID/status
}

myParent()
{
	PID=$$
	PPID=$(awk '/^PPid:/{print $2}' /proc/$PID/status)
	awk '/^Name:/{print $2}' /proc/$PPID/status
}

launchApp() {
	FREEDESKTOP=/usr/local/share/applications
	if [ -e "$FREEDESKTOP"/"$1".desktop ]
	then
		E=`awk 'BEGIN{FS="Exec="}/^Exec/{print $2}' "$FREEDESKTOP"/"$1".desktop`
 		E="${E% \%*}"
		T=`awk 'BEGIN{FS="Terminal="}/^Terminal/{print $2}' "$FREEDESKTOP"/"$1".desktop`
 		shift 1
		if [ "$1" != "cliorx" ] && `echo $T | grep -qi true`
		then
			exec cliorx ${E} "$@" &
		else
			exec ${E} "$@" &
		fi
	else
		fullpath=`which $1`
		if [ "$?" -eq 0 ] && `echo $fullpath | grep -qv ondemand`
		then
			E=$1
			shift 1
			exec $E "$@" &
		else
			echo "Already loaded. Call from regular menu or terminal."
			printf "\a"
		fi
	fi
}

###################################################################

use32(){
  VMLINUZ="vmlinuz"
  ROOTFS="core"
  BUILD="x86"
}

use64(){
  VMLINUZ="vmlinuz64"
  ROOTFS="corepure64"
  BUILD="x86_64"
}

install_ext(){
  app="${1//-KERNEL.tcz/-${KERNELVER}.tcz}"
  source=$2
  onboot=$3

  dest=/mnt/drive/tce/optional

  [ -d $dest ] || mkdir -p $dest

  cp -a "$source/$app" "$dest" 2>/dev/null
  cp -a "$source/$app.dep" "$dest" 2>/dev/null
  cp -a "$source/$app.md5.txt" "$dest" 2>/dev/null
  cp -a "$source/$app.zsync; sleep 1" "$dest" 2>/dev/null
  cp -a "$source/$app.tree" "$dest" 2>/dev/null

  if [ "$onboot" = "yes" ]; then
    echo "$app" >> /mnt/drive/tce/onboot.lst
  fi

  if [ -f $source/$app.dep ]; then
    for depapp in `cat $source/$app.dep`; do
      install_ext $depapp $source no
    done
  fi
}

copy_tce(){

  if [ "$COREPLUS" = "yes" ]; then
    if [ "$COREPLUSINSTALLTYPE" = "X" ]; then
      for EXTENSION in $(echo "$XBASE") $DESKTOP.tcz; do
        install_ext $EXTENSION $BOOT/../cde/optional yes
      done
    fi

    for INSTALLGROUP in `echo $COREPLUSINSTGROUP | tr ',' ' '`; do
      if [ -e "$BOOT/../cde/$INSTALLGROUP.instlist" ]; then
        for EXTENSION in `cat $BOOT/../cde/$INSTALLGROUP.instlist`; do
          install_ext $EXTENSION $BOOT/../cde/optional yes
        done
      fi
    done
  else
    if [ -d "$STANDALONEEXTENSIONS" ]; then
      mkdir -p /mnt/drive/tce/optional
      cp -r "$STANDALONEEXTENSIONS/optional" /mnt/drive/tce
      if [ -e "$STANDALONEEXTENSIONS/onboot.lst" ]; then
        cp "$STANDALONEEXTENSIONS/onboot.lst" /mnt/drive/tce
      fi
    else
      # Last resort an iso was specified so copy the cde into tce
      [ -d /mnt/staging/cde ] && cp -a /mnt/staging/cde/* /mnt/drive/tce/.
      sync; sleep 1
    fi
  fi


  chown -R tc.staff /mnt/drive/tce 2>/dev/null
  chmod -R u+w /mnt/drive/tce 2>/dev/null

}

abort(){
  if [ "$DISPLAY" ] && [ "$INTERACTIVE" ]; then
    echo -n "Press Enter key."
    read gagme
  fi
  exit 1
}

toggle_active(){
  echo -e "a\n$PARTITION\nw" | fdisk /dev/$DEVICE > /dev/null 2>&1
  hdparm -z /dev/$DEVICE > /dev/null 2>&1
  sync; sleep 1
}

partition_setup_common(){
  echo "Writing zero's to beginning of /dev/$DEVICE"
  dd if=/dev/zero of=/dev/$DEVICE bs=1k count=1 > /dev/null 2>&1 &
  sync; sleep 1
  echo "Partitioning /dev/$DEVICE"
  if [ "$FORMAT" == "vfat" ]; then
    echo -e "n\np\n1\n\n\na\n1\nt\nc\nw" | fdisk /dev/$DEVICE > /dev/null 2>&1
  else
    echo -e "n\np\n1\n\n\na\n1\nt\n83\nw" | fdisk /dev/$DEVICE > /dev/null 2>&1
  fi
  sync; sleep 1
}

iso_prep(){
  # We need to mount the ISO file using the loopback driver.
  # Start by creating a mount point directory; we'll call it "staging"
  if [ -d /mnt/staging ]; then
    if mounted /mnt/staging; then umount /mnt/staging; fi
  else
    mkdir /mnt/staging
  fi
  mount -t iso9660 -o loop,ro $SOURCE /mnt/staging
  if [ $? != 0 ]; then
    umount /mnt/drive  # unmount the target drive
    echo "Sorry $SOURCE not found!"
    echo "Installation not successful!"
    abort
  fi
  IMAGE="/mnt/staging"
  BOOT="/mnt/staging/boot/"
  [ -f "$BOOT"/vmlinuz ] && use32
  [ -f "$BOOT"/vmlinuz64 ] && use64
  [ -f "$BOOT"/vmlinuz ] && [ -f "$BOOT"/vmlinuz64 ] && {
    [ "$(uname -m)" = "i686" ] && use32 || use64
  }
}

hdd_setup(){
  partition_setup_common
  sync; sleep 1
  rebuildfstab

  echo Formatting /dev/"$TARGET"
  if [ "$FORMAT" == "vfat" ]; then
    mkdosfs /dev/"$TARGET"
  else
    mkfs."$FORMAT" -O \^64bit -F -m 0 /dev/"$TARGET" > /dev/null || abort
  fi
  sync; sleep 1

  dd if=/usr/local/share/syslinux/mbr.bin of=/dev/$DEVICE bs=440 count=1
  sync; sleep 1
}

zip_setup(){
  echo "Changing geometry for USB-ZIP compatibility on /dev/$DEVICE"
  mkdiskimage -1 /dev/$DEVICE 16 64 32
  if [ $? != 0 ]; then
    echo "Error creating USB-ZIP compatible filesystem."
    abort
  fi
  # Use remaining drive for backup/restore and tce
  DATA="$DEVICE"2
  echo "Partitioning /dev/$DEVICE"
  echo -e "n\np\n2\n\n\nt\n2\nb\nw" | fdisk /dev/$DEVICE > /dev/null 2>&1
  sync; sleep 1
  echo "Formatting /dev/$DATA"
  mkdosfs /dev/$DATA
  sync; sleep 1
  rebuildfstab

  echo Formatting /dev/"$TARGET"
  mkdosfs /dev/"$TARGET"
  if [ $? != 0 ]; then
    echo "Error while formatting DOS filesystem."
    abort
  fi
  sync; sleep 1
  echo "Setting up boot loader on /mnt/$TARGET"
  syslinux --install  /dev/"$TARGET"
  if [ $? != 0 ]; then
    echo "Error writing boot sector"
    abort
  fi
  sync; sleep 1
}

frugal_setup(){
  if [ "$DEVICE" == "$TARGET" -a "$FORMAT" != "none" ]
  then
    partition_setup_common
    sync; sleep 1
    rebuildfstab
  fi

  [ "$DEVICE" == "$TARGET" ] && {
    TARGET="$DEVICE"1
    [ "$(echo $DEVICE | grep -o '[[:alpha:]]*')" = "mmcblk" ] && TARGET="$DEVICE"p1
  }

  if [ "$FORMAT" != "none" ]
  then
    echo Formatting /dev/"$TARGET"
    p="$(echo "$TARGET" | grep -o [[:digit:]]*$)"
    if [ "$FORMAT" == "vfat" ]; then
      mkfs.vfat /dev/"$TARGET" > /dev/null || abort
      [ "$TITLE" = "partition" ] && echo -e "t\n$p\nc\nw" | fdisk /dev/$DEVICE > /dev/null 2>&1
    else
      mkfs."$FORMAT" -O \^64bit -F -m 0 /dev/"$TARGET" > /dev/null || abort
      [ "$TITLE" = "partition" ] && echo -e "t\n$p\n83\nw" | fdisk /dev/$DEVICE > /dev/null 2>&1
    fi
    sync; sleep 1
  fi

  [ "$BOOTLOADER" == "yes" ] && dd if=/usr/local/share/syslinux/mbr.bin of=/dev/$DEVICE bs=440 count=1
  [ "$BOOTLOADER" == "yes" ] && sync; sleep 1
}

syslinux_setup(){
  echo "Setting up $ROOTFS image on /mnt/$TARGET"
  mount -t vfat /dev/$TARGET /mnt/drive
  if [ $? != 0 ]; then
    echo "Error mounting device"
    abort
  fi
  [ "$BOOTLOADER" == "yes" ] && [ -d $BOOTDIR ] || mkdir -p $BOOTDIR
  [ -d /mnt/drive/tce ] || mkdir -p /mnt/drive/tce/optional

  cp  $BOOT/$VMLINUZ $BOOTDIR
  cp  $BOOT/"$ROOTFS".gz $BOOTDIR

  copy_tce

  if [ "$BOOTLOADER" == "yes" ]; then
    echo "DEFAULT $ROOTFS" > /mnt/drive/syslinux.cfg
    echo "LABEL $ROOTFS" >> /mnt/drive/syslinux.cfg
    echo "KERNEL $BOOTPATH/$VMLINUZ" >> /mnt/drive/syslinux.cfg
    echo "APPEND initrd=$BOOTPATH/$ROOTFS.gz quiet waitusb=5:"$TARGETUUID" tce="$TARGETUUID" " >> /mnt/drive/syslinux.cfg
    sync
    sed -i s"~quiet ~quiet $OPTIONS ~" /mnt/drive/syslinux.cfg
  fi

  sync
  [ -f /mnt/drive/tce/${MYDATA}.tgz ] || touch /mnt/drive/tce/${MYDATA}.tgz
  [ "$BOOTLOADER" == "yes" ] && echo "Applying syslinux."
  [ "$BOOTLOADER" == "yes" ] && syslinux --install /dev/$TARGET > /dev/null 2>&1
  sync
  umount /mnt/drive
}

zip_update(){
  DATA="$DEVICE"2
  DATAUUID=`blkid -s UUID /dev/"$DATA"|cut -f2 -d\ `
  echo "Setting up boot image on /mnt/$TARGET"
  mount -t vfat /dev/"$TARGET" /mnt/drive
  if [ $? != 0 ]; then
    echo "Error mounting usb device partition 1"
    abort
  fi
  echo "Setting up $ROOTFS image on /mnt/$TARGET"
  cp  $BOOT/$VMLINUZ /mnt/drive/
  cp  $BOOT/"$ROOTFS".gz /mnt/drive
  sync; sleep 1
  echo "DEFAULT $ROOTFS" > /mnt/drive/syslinux.cfg
  echo "LABEL $ROOTFS" >> /mnt/drive/syslinux.cfg
  echo "KERNEL $VMLINUZ" >> /mnt/drive/syslinux.cfg
  echo "INITRD $ROOTFS.gz" >> /mnt/drive/syslinux.cfg
  echo "APPEND quiet waitusb=5:"$DATAUUID" tce="$DATAUUID" " >> /mnt/drive/syslinux.cfg
  sync; sleep 1
  sed -i s"~quiet ~quiet $OPTIONS ~" /mnt/drive/syslinux.cfg
  sync; sleep 1
  umount /mnt/drive
  mount -t vfat /dev/$DATA /mnt/drive
  if [ $? != 0 ]; then
    echo "Error mounting usb device partition 2"
    abort
  fi
  [ -d /mnt/drive/tce ] || mkdir /mnt/drive/tce
  [ -f /mnt/drive/tce/${MYDATA}.tgz ] || touch /mnt/drive/tce/${MYDATA}.tgz
  copy_tce
  umount /mnt/drive
}

extlinux_setup(){
  sync; sleep 1
  mount /dev/"$TARGET" /mnt/drive
  if [ $? != 0 ]; then
    echo "Error mounting usb device"
    abort
  fi

  [ "$BOOTLOADER" == "yes" ] && echo "Applying extlinux."
  [ "$BOOTLOADER" == "yes" ] && [ -d $BOOTDIR/extlinux ] || mkdir -p $BOOTDIR/extlinux
  [ "$BOOTLOADER" == "yes" ] && extlinux -i $BOOTDIR/extlinux
  sync; sleep 1

  echo "Setting up $ROOTFS image on /mnt/$TARGET"
  [ -d /mnt/drive/tce ] || mkdir /mnt/drive/tce

  cp  $BOOT/$VMLINUZ $BOOTDIR
  cp  $BOOT/"$ROOTFS".gz $BOOTDIR

  copy_tce

  if [ "$BOOTLOADER" == "yes" ]; then

    # check for a Windows / Linux partition and if found make a boot menu.
    column="$(fdisk -l 2> /dev/null | grep -i Id | head -n 1 | awk '
      BEGIN {IGNORECASE=1} {
        for (i = 1; i <= NF; ++i) {
          if ($i == "Id") {print i}
        }
      }'
    )"
    LOCALOS="$(fdisk -l 2> /dev/null | awk -v c="$column" -v d="$DEVICE" '
        (/\*/) && ($1 ~ d) {
          type = $c
          results = $1
          if (type == "7" || type == "b" || type == "c") {
            print results " windows"
          } else if (type == "6") {
            print results " fat16"
          } else if (type == "83" || type == "8e" || type == "a5") {
            print results " linux"
          } else {
            print results " unknown"
          }
        }
      '
    )"

    > $BOOTDIR/extlinux/extlinux.conf

    if [ -n "$LOCALOS" ]; then
      if [ "$TYPE" == "frugal" ] && [ "$MARKACTIVE" == "1" ]; then
        echo "Setting up menu for Tiny Core"
        cp /usr/local/share/syslinux/vesamenu.c32 $BOOTDIR/extlinux/
        cp /usr/local/share/syslinux/chain.c32 $BOOTDIR/extlinux/
        cp /usr/local/share/syslinux/libcom32.c32 $BOOTDIR/extlinux/
        cp /usr/local/share/syslinux/libutil.c32 $BOOTDIR/extlinux/
        echo "UI vesamenu.c32" >> $BOOTDIR/extlinux/extlinux.conf
        echo "MENU TITLE Tiny Core Bootloader" >> $BOOTDIR/extlinux/extlinux.conf
        echo "TIMEOUT 100" >> $BOOTDIR/extlinux/extlinux.conf
        echo "" >> $BOOTDIR/extlinux/extlinux.conf
      fi
    fi

    echo "DEFAULT $ROOTFS" >> $BOOTDIR/extlinux/extlinux.conf
    echo "LABEL $ROOTFS" >> $BOOTDIR/extlinux/extlinux.conf
    echo "KERNEL $BOOTPATH/$VMLINUZ" >> $BOOTDIR/extlinux/extlinux.conf
    echo "INITRD $BOOTPATH/$ROOTFS.gz" >> $BOOTDIR/extlinux/extlinux.conf
    echo "APPEND quiet waitusb=5:"$TARGETUUID" tce="$TARGETUUID" " >> $BOOTDIR/extlinux/extlinux.conf

    if [ -n "$LOCALOS" ]; then
      if [ "$TYPE" == "frugal" ] && [ "$MARKACTIVE" == "1" ]; then
        LC_PART=$(echo $LOCALOS | cut -d ' ' -f 1 | grep -o [[:digit:]])
        LC_OS=$(echo $LOCALOS | cut -d ' ' -f 2)
        echo "" >> $BOOTDIR/extlinux/extlinux.conf
        if [ "$LC_OS" = "windows" ]; then
          echo "LABEL windows" >> $BOOTDIR/extlinux/extlinux.conf
        fi
        if [ "$LC_OS" = "fat16" ]; then
          echo "LABEL fat16" >> $BOOTDIR/extlinux/extlinux.conf
          echo "MENU LABEL Bootable FAT16" >> $BOOTDIR/extlinux/extlinux.conf
        fi
        if [ "$LC_OS" = "linux" ]; then
          mkdir -p /mnt/linux
          if mounted /mnt/linux; then umount /mnt/linux; fi
          mount $(echo $LOCALOS | cut -d ' ' -f 1) /mnt/linux
          DISTRO="$(cat /mnt/linux/etc/*-release 2> /dev/null)"
          echo "LABEL linux" >> $BOOTDIR/extlinux/extlinux.conf
          [ -n "$DISTRO" ] && {
            echo "$DISTRO" | grep -q PRETTY_NAME && NAME=$(echo "$DISTRO" | grep PRETTY_NAME | cut -d '=' -f 2) || {
              echo "$DISTRO" | grep -q "^NAME" && NAME=$(echo "$DISTRO" | grep "^NAME" | cut -d '=' -f 2) || {
                [ `echo "$DISTRO" | sort -u | wc -l` = 1 ] && NAME=$(echo "$DISTRO" | sort -u) || NAME="Unknown Linux"
              }
            }
          } || {
            NAME="Unknown Linux"
          }
          echo "MENU LABEL $NAME" >> $BOOTDIR/extlinux/extlinux.conf
          umount /mnt/linux
        fi
        if [ "$LC_OS" = "unknown" ]; then
          echo "LABEL unknown" >> $BOOTDIR/extlinux/extlinux.conf
          echo "MENU LABEL Unknown OS" >> $BOOTDIR/extlinux/extlinux.conf
        fi
        echo "COM32 chain.c32" >> $BOOTDIR/extlinux/extlinux.conf
        echo "APPEND boot ${LC_PART}" >> $BOOTDIR/extlinux/extlinux.conf
      fi
    fi

    sync; sleep 1
    sed -i s"~quiet ~quiet $OPTIONS ~" $BOOTDIR/extlinux/extlinux.conf
  fi

  [ -f /mnt/drive/tce/${MYDATA}.tgz ] || touch /mnt/drive/tce/${MYDATA}.tgz
  sync; sleep 1
  umount /mnt/drive
}

getINSTALL(){
  clear
  echo
  echo "${WHITE}Core Installation.${NORMAL}"
  echo
  INSTALL="i"
  INTERACTIVE="y"
}

getROOTFS(){
  echo -n "${CYAN}Install from [R]unning OS, from booted [C]drom, from [I]so file, or from [N]et. ${YELLOW}(r/c/i/n): ${NORMAL}"
  read FROM
  case "$FROM" in
    "R" | "r")
    echo "Enter ${WHITE}boot directory path${NORMAL} to vmlinuz/vmlinuz64 and core.gz/corepure64.gz."
    echo -n "${WHITE}(EXAMPLE: ${YELLOW}/mnt/sda1/tce/boot/): ${NORMAL}"
    read BOOT

    if [ -z "$BOOT" ]; then
      echo "No path entered. The script will be terminated."
      abort
    fi

    if [ "$(uname -m)" = "i686" ]; then
      [ -f "$BOOT"/vmlinuz ] && VMLINUZ="vmlinuz" || MISSING="vmlinuz "
      [ -f "$BOOT"/core.gz ] && ROOTFS="core" || MISSING="$MISSING"core.gz
    else
      [ -f "$BOOT"/vmlinuz64 ] && VMLINUZ="vmlinuz64" || MISSING="vmlinuz64 "
      [ -f "$BOOT"/corepure64.gz ] && ROOTFS="corepure64" || MISSING="$MISSING"corepure64.gz
    fi

    if [ -n "$MISSING" ]; then
      echo "Could not find system file(s): $MISSING"
      abort
    fi
    echo "Using: ${GREEN}$BOOT/$ROOTFS.gz${NORMAL}"
    ;;

    "C" | "c")
    total=0
    count=0
    CDROMS=`cat /etc/sysconfig/cdroms 2>/dev/null | grep -o sr[[:digit:]]`
    for CD in $CDROMS; do
      [ -d /mnt/"$CD" ] && mount /mnt/"$CD" 2>/dev/null
      total=`expr $total + 1`
      KERNEL_FOUND=false
      ROOTFS_FOUND=false
      if [ -d /mnt/"$CD"/boot ]; then
        [ -r /mnt/"$CD"/boot/vmlinuz ] &&  KERNEL_FOUND=true
        [ -r /mnt/"$CD"/boot/core.gz ] && ROOTFS_FOUND=true
        [ -r /mnt/"$CD"/boot/vmlinuz64 ] && KERNEL_FOUND=true
        [ -r /mnt/"$CD"/boot/corepure64.gz ] && ROOTFS_FOUND=true
        ( $KERNEL_FOUND ) || MISSING="$MISSING""$(echo '')""missing vmlinuz/vmlinuz64 in $CD"
        ( $ROOTFS_FOUND ) || MISSING="$MISSING""$(echo '')""missing core.gz/corepure64.gz in $CD"
        ( $KERNEL_FOUND ) && ( $ROOTFS_FOUND ) && VALIDCDS="$VALIDCDS $CD"
      else
        count=`expr $count + 1`
      fi
    done
    [ "$total" -eq "$count" ] && MISSING="missing boot directory."
    if [ -z "$VALIDCDS" ]; then
      echo "Could not find a valid CD."
      if [ -n "$MISSING" ]; then
        echo "Could not find system file(s): "$MISSING""
      fi
      abort
    else
      if [ `echo $VALIDCDS | grep -o sr[[:digit:]] | wc -l` -gt 1 ]; then
        echo Please select your source:$VALIDCDS
        read CD
        $(echo $CD | grep -q "^sr[[:digit:]]$") || { echo Invalid source, terminating...;abort; }
      else
        CD=`trim $VALIDCDS`
      fi
    fi
    BOOT=/mnt/"$CD"/boot
    [ -r "$BOOT"/vmlinuz ] && use32
    [ -r "$BOOT"/vmlinuz64 ] && use64
    [ -r "$BOOT"/vmlinuz ] && [ -r "$BOOT"/vmlinuz64 ] && {
      [ "$(uname -m)" = "i686" ] && use32 || use64
    }
    echo "Using: ${GREEN}$BOOT/$ROOTFS.gz${NORMAL}"
    ;;

    "I" | "i")
    # read path from user
    echo -n "${CYAN}Enter the full path to the iso.  ${WHITE}(EXAMPLE: ${YELLOW}/tmp/CorePlus-7.2.iso): ${NORMAL}"
    read SOURCE
    if [ -z "$SOURCE" ] ; then
      echo "No path entered. The script will be terminated."
      abort
    fi
    if [ ! -f "$SOURCE" ]; then
      echo "Cound not find: $SOURCE"
      abort
    fi
    ;;

    "N" | "n")
    net_setup
    ;;

    *)
    echo "Invalid option."
    abort
    ;;
  esac

  [ -z "$BOOT" ] && iso_prep
}

getTYPE(){
  clear
  echo
  echo "Select install type for ${GREEN}$BOOT/$ROOTFS.gz${NORMAL}"
  echo
  echo "${RED}Frugal${NORMAL}"
  echo "* Use for frugal ${RED}hard drive${NORMAL} installations."
  echo "${YELLOW}Note: ${NORMAL}You will be prompted for disk/partion and formatting options."
  echo
  echo "${WHITE}HDD${NORMAL}"
  echo "* Use for ${WHITE}pendrives${NORMAL}. Your BIOS must support ${WHITE}USB-HDD${NORMAL} booting."
  echo "* A single FAT partition will be made."
  echo "${YELLOW}Note: ${NORMAL}Requires dosfstools extension."
  echo "${MAGENTA}Warning: ${NORMAL}This is a whole drive installation!"
  echo
  echo "${BLUE}Zip${NORMAL}"
  echo "* Use for ${BLUE}pendrives${NORMAL}. Drive will be formatted into two FAT partitions."
  echo "* One small one for ${BLUE}USB_ZIP${NORMAL} boot compatibility, and used to hold Tiny Core."
  echo "* The remaining partition will be used for backup & extensions."
  echo "${YELLOW}Note: ${NORMAL}Requires dosfstools and perl extensions."
  echo "${MAGENTA}Warning: ${NORMAL}This is a whole drive installation!"
  echo
  echo -n "${CYAN}Select Install type [F]rugal, [H]DD, [Z]ip. ${YELLOW}(f/h/z): ${NORMAL}"
  read TYPE
  case "$TYPE" in
    "H" | "h")
    TYPE="hdd"
    ;;
    "Z" | "z")
    TYPE="zip"
    ;;
    "F" | "f")
    TYPE="frugal"
    ;;
    *)
    echo "Invalid Boot type."
    abort
    ;;
  esac
}

getCOREPLUS(){
  if grep -i "plus" "$BOOT/isolinux/isolinux.cfg" > /dev/null 2>&1; then
    COREPLUS=yes
  else
    COREPLUS=no
  fi
}

getBOOTLOADER(){
  clear
  echo "Would you like to install a bootloader?"
  echo "Most people should answer yes unless they are trying to embed Core"
  echo "into a different Linux distribution with an existing bootloader."
  echo ""
  echo -n "Enter selection ( y, n ) or (q)uit: "
  read BOOTLOADER
  case "$BOOTLOADER" in
    "Y" | "y")
    BOOTLOADER="yes"
    ;;
    "N" | "n")
    BOOTLOADER="no"
    ;;
    "Q" | "q")
    exit
    ;;
    *)
    echo "Invalid option. "
    abort
    ;;
  esac
}

getCOREPLUSINSTGROUP(){
  clear
  echo "Select Extensions to install from CorePlus CD"
  COREPLUSINSTGROUP=""

  for INSTGROUP in wifi ndiswrapper wififirmware installer remaster kmaps; do
    [ "$INSTGROUP" == "wifi" ] && DESC="Wifi Support"
    [ "$INSTGROUP" == "ndiswrapper" ] && DESC="ndiswrapper"
    [ "$INSTGROUP" == "wififirmware" ] && DESC="Wireless Firmware"
    [ "$INSTGROUP" == "installer" ] && DESC="Installer tool"
    [ "$INSTGROUP" == "remaster" ] && DESC="Remaster tool"
    [ "$INSTGROUP" == "kmaps" ] && DESC="Non-US keyboard layout support"
    echo -n "Install Extensions for $DESC ?  "
    echo -n  " (y)es or (n)o "
    read ANS
    until [ "$ANS" == "y" ] || [ "$ANS" == "n" ]; do
      echo -n "Install Extensions for $DESC ?  "
      echo -n  " (y)es or (n)o "
      read ANS
    done
    [ "$ANS" == "y" ] && COREPLUSINSTGROUP="$COREPLUSINSTGROUP,$INSTGROUP"
  done
}

getCOREPLUSINSTALLTYPE(){
  clear
  echo "Would you like to install Core Only (Text Mode Interface) or "
  echo "Core and the FLWM X GUI?"
  echo ""
  echo -n "Enter selection (c)ore only, (g)rahpical X interface or (q)uit: "
  read COREPLUSINSTALLTYPE
  case "$COREPLUSINSTALLTYPE" in
    "C" | "c")
    COREPLUSINSTALLTYPE="Core"
    ;;
    "G" | "g")
    COREPLUSINSTALLTYPE="X"
    ;;
    "Q" | "q")
    exit
    ;;
    *)
    echo "Invalid option. "
    abort
    ;;
  esac
}

getTARGET(){
  DISKFLAG="-d"; TITLE="disk"
  if [ "$TYPE" == "frugal" ]; then
    > /tmp/tmpfile
    for i in "Whole Disk" "Partition"; do
      printf "%s\n" "$i" >> /tmp/tmpfile
    done
    /usr/bin/select "Select Target for Installation of $ROOTFS" /tmp/tmpfile 0
    rm /tmp/tmpfile
    [ "$(cat ${SELANS})" == "q" ] && abort
    if [ "$(cat ${SELANS})" == 2 ]; then
      DISKFLAG="-p"
      TITLE="partition"
    else
      WHOLEDISK="yes"
    fi
  else
    WHOLEDISK="yes"
  fi

  fetch_devices "$DISKFLAG" > /tmp/tmpfile
  /usr/bin/select "Select $TITLE for $ROOTFS" /tmp/tmpfile 1
  TARGET=`awk '{print $1}' < "$SELANS"`
  TARGET=`trim $TARGET`
  [ "$(cat ${SELANS})" == "q" ] && abort
  DEVICE="$(echo "$TARGET" | grep -Eo '^[[:lower:]]*|^mmcblk[0-9]*')"
  [ "$TYPE" == "frugal" ] || {
    TARGET="$DEVICE"1
    [ "$(echo $DEVICE | grep -o '[[:alpha:]]*')" = "mmcblk" ] && TARGET="$DEVICE"p1
  }
  if [ -z "$DEVICE" ] ; then
    echo "No device chosen. The script will be terminated."
    abort
  fi

  grep -q ^/dev/"$DEVICE" /etc/mtab
  if [ "$?" == 0  ]; then
    echo "$DEVICE appears to have a partition already mounted!"
    echo "Check if correct device, if so,  umount it."
    abort
  fi
  rm /tmp/tmpfile
  TARGET=`trim $TARGET`
  DEVICE=`trim $DEVICE`
}

getFORMAT(){
  if [ "$WHOLEDISK" == "yes" ]; then
    for i in "ext2" "ext3" "ext4" "vfat"
    do
      printf "%s\n" "$i" >> /tmp/tmpfile
    done
  else
    for i in "none" "ext2" "ext3" "ext4" "vfat"
    do
      printf "%s\n" "$i" >> /tmp/tmpfile
    done
  fi

  /usr/bin/select "Select Formatting Option for $TARGET" /tmp/tmpfile 1
  rm /tmp/tmpfile
  [ "$(cat ${SELANS})" == "q" ] && abort
  FORMAT="$(cat ${SELANS})"
}

getOPTIONS(){
  echo "${CYAN}Enter space separated boot options: "
  echo "${WHITE}Example: ${YELLOW}vga=normal syslog showapps waitusb=5${NORMAL} "
  read OPTIONS
}

net_setup(){
  [ "$INTERACTIVE" ] && clear
  LATEST=`wget -t 3 -c -q -O - $(cat /opt/tcemirror)latest-$(getBuild) 2>/dev/null`
  if [ -n "$LATEST" ]; then
    [ "$INTERACTIVE" ] && echo -n ${CYAN}
    echo The latest version is "$LATEST"
    [ "$INTERACTIVE" ] && echo -n ${NORMAL}
  else
    [ "$INTERACTIVE" ] && echo -n ${RED}
    echo Error, can not connect to internet.
    [ "$INTERACTIVE" ] && echo -n ${NORMAL}
    abort
  fi
  mkdir -p /tmp/net_source
  cd /tmp/net_source
  BOOT="/tmp/net_source"
  if [ "$INTERACTIVE" ]; then
    echo -n "Enter architecture (32)bit, (64)bit or (q)uit: "
    read ARCH
    if [ "$ARCH" = "32" ]; then
      use32
    else
      if [ "$ARCH" = "64" ]; then
        use64
      else
        echo "Invalid Arch type."
        abort
      fi
    fi
  fi
  echo Downloading "$ROOTFS".gz
  wget -t 3 -c $(cat /opt/tcemirror)${LATEST%%.*}.x/$BUILD/release/distribution_files/"$ROOTFS".gz
  wget -t 3 -c -q $(cat /opt/tcemirror)${LATEST%%.*}.x/$BUILD/release/distribution_files/"$ROOTFS".gz.md5.txt
  [ -n "$(cat "$ROOTFS".gz.md5.txt)" ] && [ "$(md5sum "$ROOTFS".gz)" = "$(cat "$ROOTFS".gz.md5.txt)" ] || {
    [ "$INTERACTIVE" ] && echo -n ${RED}
    echo Error, md5 checksum does not match.
    echo Please select a faster mirror with appbrowser,
    echo or modify /opt/tcemirror manually.
    [ "$INTERACTIVE" ] && echo -n ${NORMAL}
    abort
  }
  echo Downloading "$VMLINUZ"
  wget -t 3 -c $(cat /opt/tcemirror)${LATEST%%.*}.x/$BUILD/release/distribution_files/"$VMLINUZ"
  wget -t 3 -c -q $(cat /opt/tcemirror)${LATEST%%.*}.x/$BUILD/release/distribution_files/"$VMLINUZ".md5.txt
  [ -n "$(cat "$VMLINUZ".md5.txt)" ] && [ "$(md5sum "$VMLINUZ")" = "$(cat "$VMLINUZ".md5.txt)" ] || {
    [ "$INTERACTIVE" ] && echo -n ${RED}
    echo Error, md5 checksum does not match.
    echo Please select a faster mirror with appbrowser,
    echo or modify /opt/tcemirror manually.
    [ "$INTERACTIVE" ] && echo -n ${NORMAL}
    abort
  }
}









#Main
checkroot
MYDATA=mydata
[ -r /etc/sysconfig/mydata ] && read MYDATA < /etc/sysconfig/mydata
export PATH="$PATH:."
KERNELVER=$(uname -r)
SELANS=/tmp/select.ans
i=0
[ "$#" -ge 9 ] && until [ -z "$1" ]; do
  i=`expr $i + 1`
  case $i in
    1) SOURCE="$1"
    if [ "${SOURCE##*.}" == "iso" ]; then
      iso_prep
    else
      BOOT="${SOURCE%/*}"
      [ -r "$BOOT"/vmlinuz ] && use32
      [ -r "$BOOT"/vmlinuz64 ] && use64
      [ -r "$BOOT"/vmlinuz ] && [ -r "$BOOT"/vmlinuz64 ] && {
        [ "$(uname -m)" = "i686" ] && use32 || use64
      }
    fi
    echo "$SOURCE" | grep -q "/tmp/net_source/" && {
      echo "$SOURCE" | grep -q "corepure64" && use64 || use32
      net_setup
    }
    ;;
    2) TYPE="$1"
    ;;
    3) TARGET="$1"
    DEVICE="$(echo $1 | grep -Eo '^[[:lower:]]*|^mmcblk[0-9]*')"
    echo "$TARGET" | sed "s/$DEVICE//g" | grep -q "[0-9]" && TITLE="partition"
    [ "$TYPE" == "frugal" ] || {
      TARGET="$DEVICE"1
      [ "$(echo $DEVICE | grep -o '[[:alpha:]]*')" = "mmcblk" ] && TARGET="$DEVICE"p1
    }
    ;;
    4) MARKACTIVE="$1"
    ;;
    5) FORMAT="$1"
    INSTALL="i"
    ;;
    6) BOOTLOADER="$1"
    ;;
    7) COREPLUS="$1"
    ;;
    8) COREPLUSINSTALLTYPE="$1"
    ;;
    9) COREPLUSINSTGROUP="$1"
    ;;
    10) STANDALONEEXTENSIONS="$1"
    ;;
    *) OPTIONS="$OPTIONS $1"
    ;;
  esac
  shift
done

echo $BOOT > /tmp/install.opt
echo $ROOTFS >> /tmp/install.opt
echo $TYPE >> /tmp/install.opt
echo $DEVICE >> /tmp/install.opt
echo $TARGET >> /tmp/install.opt
echo $MARKACTIVE >> /tmp/install.opt
echo $FORMAT >> /tmp/install.opt
echo $OPTIONS >> /tmp/install.opt

[ -n "$INSTALL" ] || getINSTALL
[ -n "$ROOTFS" ] || getROOTFS
[ -n "$TYPE" ] || getTYPE
[ -n "$TARGET" ] || getTARGET
if [ "$TYPE" == "frugal" ]; then
  [ -n "$BOOTLOADER" ] || getBOOTLOADER
else
  BOOTLOADER="yes"
fi
[ -n "$COREPLUS" ] || getCOREPLUS
if [ "$COREPLUS" == "yes" ]; then
  [ -n "$COREPLUSINSTALLTYPE" ] || getCOREPLUSINSTALLTYPE
  [ -n "$COREPLUSINSTGROUP" ] || getCOREPLUSINSTGROUP
fi
if [ -z "$STANDALONEEXTENSIONS" ]; then
  [ "$INTERACTIVE" ] && read -p $'Install Extensions from this TCE/CDE Directory:\n' STANDALONEEXTENSIONS
  [ -n "$STANDALONEEXTENSIONS" ] || STANDALONEEXTENSIONS="none"
fi

if [ "$TYPE" != "zip" ]; then
  [ -n "$FORMAT" ] || getFORMAT
fi

if [ "$INTERACTIVE" ]; then
  PARTITION="$(echo "$TARGET" | grep -o [[:digit:]]*$)"
  if [ "$TYPE" == "frugal" ] && [ -n "$PARTITION" ]; then
    ANS=""
    until [ "$ANS" == "y" ] || [ "$ANS" == "n" ]; do
      echo -n "Mark $TARGET active bootable? y/n: "; read ANS
    done
    [ "$ANS" == "y" ] && MARKACTIVE=1
  fi
  getOPTIONS
  echo
  echo "${RED}Last chance to exit before destroying all data on ${MAGENTA}$TARGET${NORMAL}"
  echo -n "${CYAN}Continue (y/..)?${NORMAL} "
  read answer
  if [ "$answer" != "y" ]; then
    echo "Aborted.."
    abort
  fi
  clear
fi

grep -q ^/dev/"$DEVICE" /etc/mtab
if [ "$?" == 0  ]; then
  echo "$DEVICE appears to have a partition already mounted!"
  echo "Check if correct device, if so,  umount it and then"
  echo "run installer again."
  abort
fi

if [ "$COREPLUS" = "yes" -a "$COREPLUSINSTALLTYPE" = "X" ]; then
  DESKTOP="$(cat /etc/sysconfig/desktop 2> /dev/null)"
  [ -z $DESKTOP ] && DESKTOP="flwm_topside"
  XBASE="$(cat $BOOT/../cde/xbase.lst)"
fi

BOOTDIR="/mnt/drive/boot"
[ "$TYPE" == "frugal" ] && BOOTDIR="/mnt/drive/tce/boot"
BOOTPATH="/boot"
[ "$TYPE" == "frugal" ] && BOOTPATH="/tce/boot"

case "$TYPE" in
  "hdd") hdd_setup ;;
  "zip") zip_setup ;;
  "frugal") frugal_setup ;;
esac

rebuildfstab
[ -d /mnt/drive ] || mkdir /mnt/drive
TARGETUUID="$(blkid -s UUID /dev/${TARGET} | awk '{print $2}')"
echo "$TARGETUUID"
if [ "$TYPE" == "zip" ]; then
  zip_update
else
  if [ "$FORMAT" == "vfat" ] || ( [ "$FORMAT" == "none" ] && fdisk -l | grep "$TARGET " | grep -i fat >/dev/null ); then
    syslinux_setup
  else
    extlinux_setup
  fi
fi

if [ "$TYPE" == "frugal" ] && [ "$MARKACTIVE" == "1" ]; then
  ACTIVE=$(fdisk -l 2>/dev/null | grep "^/dev/$DEVICE" | awk '/\*/ {print $1}')
  if [ -n "$ACTIVE" ]; then
    for i in $ACTIVE; do
      echo "Remove Active Flag on $i"
      PARTITION=$(echo "$i" | grep -o [[:digit:]]*$)
      toggle_active
    done
  fi
  echo "Toggle Active Flag on $TARGET"
  PARTITION=$(echo "$TARGET" | grep -o [[:digit:]]*$)
  toggle_active
fi

echo "Installation has completed"

if mounted /mnt/staging; then umount /mnt/staging; fi
if [ "$INTERACTIVE" ]; then
  echo -n "Press Enter key to continue."
  read gagme
fi




























######################################

# Check there is a disk
fdisk -l $TARGET 2>&1 | grep -q bytes
[ "$?" -ne 0 ] && echo "No disk found" && \
 sleep 10 && out
# Zero out the partition table

dd if=/dev/zero of=$TARGET bs=512 count=1


fdisk $TARGET << EOF
n
p
1


a
1
p
w
EOF

mkfs.ext3 ${TARGET}1

#rebuild
rebuildfstab



cd /mnt
ls -lart
cat /usr/local/share/syslinux/mbr.bin > $TARGET

# Mount it
mkdir /mnt/target
mount ${TARGET}1 /mnt/target
cd /mnt/target
echo "In Target"

cd /mnt
ls -lart

cd /mnt/sda1
ls -lart
echo "SDA"

cd /mnt/sdb
ls -lart
echo "SDB"
pause

cd /mnt/target
cp -rfv /mnt/sdb/boot .
cp -rfv /mnt/sdb/cde tce
cp -rfv /mnt/sdb/ydata.tgz mydata.tgz
cp -rfv /mnt/sdb/ydata.tgz tce/mydata.tgz
#mkdir tce
ls -lart
pause

echo "${TARGET}"
#dd if=/mnt/sdb1/mbr.bin of=${TARGET} bs=440 count=1
#mkdir -p boot/extlinux
#extlinux -i /mnt/target/boot/extlinux

mkdir /mnt/target/boot/grub
cp -p /usr/lib/grub/i386-pc/* /mnt/target/boot/grub/
cp -rfv /mnt/sdb/menu.lst /mnt/target/boot/grub/menu.lst
pause

grub

cd /
umount /mnt/target
# Done!
clear
echo Success.
pause
out

###################################

/usr/bin/sethostname yantra
/opt/bootlocal.sh &



frugal_setup(){
  if [ "$DEVICE" == "$TARGET" -a "$FORMAT" != "none" ]
  then
    partition_setup_common
    sync; sleep 1
    rebuildfstab
  fi

  [ "$DEVICE" == "$TARGET" ] && {
    TARGET="$DEVICE"1
    [ "$(echo $DEVICE | grep -o '[[:alpha:]]*')" = "mmcblk" ] && TARGET="$DEVICE"p1
  }

  if [ "$FORMAT" != "none" ]
  then
    echo Formatting /dev/"$TARGET"
    p="$(echo "$TARGET" | grep -o [[:digit:]]*$)"
    if [ "$FORMAT" == "vfat" ]; then
      mkfs.vfat /dev/"$TARGET" > /dev/null || abort
      [ "$TITLE" = "partition" ] && echo -e "t\n$p\nc\nw" | fdisk /dev/$DEVICE > /dev/null 2>&1
    else
      mkfs."$FORMAT" -O \^64bit -F -m 0 /dev/"$TARGET" > /dev/null || abort
      [ "$TITLE" = "partition" ] && echo -e "t\n$p\n83\nw" | fdisk /dev/$DEVICE > /dev/null 2>&1
    fi
    sync; sleep 1
  fi

  [ "$BOOTLOADER" == "yes" ] && dd if=/usr/local/share/syslinux/mbr.bin of=/dev/$DEVICE bs=440 count=1
  [ "$BOOTLOADER" == "yes" ] && sync; sleep 1
}

syslinux_setup(){
  echo "Setting up $ROOTFS image on /mnt/$TARGET"
  mount -t vfat /dev/$TARGET /mnt/drive
  if [ $? != 0 ]; then
    echo "Error mounting device"
    abort
  fi
  [ "$BOOTLOADER" == "yes" ] && [ -d $BOOTDIR ] || mkdir -p $BOOTDIR
  [ -d /mnt/drive/tce ] || mkdir -p /mnt/drive/tce/optional

  cp  $BOOT/$VMLINUZ $BOOTDIR
  cp  $BOOT/"$ROOTFS".gz $BOOTDIR

  copy_tce

  if [ "$BOOTLOADER" == "yes" ]; then
    echo "DEFAULT $ROOTFS" > /mnt/drive/syslinux.cfg
    echo "LABEL $ROOTFS" >> /mnt/drive/syslinux.cfg
    echo "KERNEL $BOOTPATH/$VMLINUZ" >> /mnt/drive/syslinux.cfg
    echo "APPEND initrd=$BOOTPATH/$ROOTFS.gz quiet waitusb=5:"$TARGETUUID" tce="$TARGETUUID" " >> /mnt/drive/syslinux.cfg
    sync
    sed -i s"~quiet ~quiet $OPTIONS ~" /mnt/drive/syslinux.cfg
  fi

  sync
  [ -f /mnt/drive/tce/${MYDATA}.tgz ] || touch /mnt/drive/tce/${MYDATA}.tgz
  [ "$BOOTLOADER" == "yes" ] && echo "Applying syslinux."
  [ "$BOOTLOADER" == "yes" ] && syslinux --install /dev/$TARGET > /dev/null 2>&1
  sync
  umount /mnt/drive
}

zip_update(){
  DATA="$DEVICE"2
  DATAUUID=`blkid -s UUID /dev/"$DATA"|cut -f2 -d\ `
  echo "Setting up boot image on /mnt/$TARGET"
  mount -t vfat /dev/"$TARGET" /mnt/drive
  if [ $? != 0 ]; then
    echo "Error mounting usb device partition 1"
    abort
  fi
  echo "Setting up $ROOTFS image on /mnt/$TARGET"
  cp  $BOOT/$VMLINUZ /mnt/drive/
  cp  $BOOT/"$ROOTFS".gz /mnt/drive
  sync; sleep 1
  echo "DEFAULT $ROOTFS" > /mnt/drive/syslinux.cfg
  echo "LABEL $ROOTFS" >> /mnt/drive/syslinux.cfg
  echo "KERNEL $VMLINUZ" >> /mnt/drive/syslinux.cfg
  echo "INITRD $ROOTFS.gz" >> /mnt/drive/syslinux.cfg
  echo "APPEND quiet waitusb=5:"$DATAUUID" tce="$DATAUUID" " >> /mnt/drive/syslinux.cfg
  sync; sleep 1
  sed -i s"~quiet ~quiet $OPTIONS ~" /mnt/drive/syslinux.cfg
  sync; sleep 1
  umount /mnt/drive
  mount -t vfat /dev/$DATA /mnt/drive
  if [ $? != 0 ]; then
    echo "Error mounting usb device partition 2"
    abort
  fi
  [ -d /mnt/drive/tce ] || mkdir /mnt/drive/tce
  [ -f /mnt/drive/tce/${MYDATA}.tgz ] || touch /mnt/drive/tce/${MYDATA}.tgz
  copy_tce
  umount /mnt/drive
}

extlinux_setup(){
  sync; sleep 1
  mount /dev/"$TARGET" /mnt/drive
  if [ $? != 0 ]; then
    echo "Error mounting usb device"
    abort
  fi

  [ "$BOOTLOADER" == "yes" ] && echo "Applying extlinux."
  [ "$BOOTLOADER" == "yes" ] && [ -d $BOOTDIR/extlinux ] || mkdir -p $BOOTDIR/extlinux
  [ "$BOOTLOADER" == "yes" ] && extlinux -i $BOOTDIR/extlinux
  sync; sleep 1

  echo "Setting up $ROOTFS image on /mnt/$TARGET"
  [ -d /mnt/drive/tce ] || mkdir /mnt/drive/tce

  cp  $BOOT/$VMLINUZ $BOOTDIR
  cp  $BOOT/"$ROOTFS".gz $BOOTDIR

  copy_tce

  if [ "$BOOTLOADER" == "yes" ]; then

    # check for a Windows / Linux partition and if found make a boot menu.
    column="$(fdisk -l 2> /dev/null | grep -i Id | head -n 1 | awk '
      BEGIN {IGNORECASE=1} {
        for (i = 1; i <= NF; ++i) {
          if ($i == "Id") {print i}
        }
      }'
    )"
    LOCALOS="$(fdisk -l 2> /dev/null | awk -v c="$column" -v d="$DEVICE" '
        (/\*/) && ($1 ~ d) {
          type = $c
          results = $1
          if (type == "7" || type == "b" || type == "c") {
            print results " windows"
          } else if (type == "6") {
            print results " fat16"
          } else if (type == "83" || type == "8e" || type == "a5") {
            print results " linux"
          } else {
            print results " unknown"
          }
        }
      '
    )"

    > $BOOTDIR/extlinux/extlinux.conf

    if [ -n "$LOCALOS" ]; then
      if [ "$TYPE" == "frugal" ] && [ "$MARKACTIVE" == "1" ]; then
        echo "Setting up menu for Tiny Core"
        cp /usr/local/share/syslinux/vesamenu.c32 $BOOTDIR/extlinux/
        cp /usr/local/share/syslinux/chain.c32 $BOOTDIR/extlinux/
        cp /usr/local/share/syslinux/libcom32.c32 $BOOTDIR/extlinux/
        cp /usr/local/share/syslinux/libutil.c32 $BOOTDIR/extlinux/
        echo "UI vesamenu.c32" >> $BOOTDIR/extlinux/extlinux.conf
        echo "MENU TITLE Tiny Core Bootloader" >> $BOOTDIR/extlinux/extlinux.conf
        echo "TIMEOUT 100" >> $BOOTDIR/extlinux/extlinux.conf
        echo "" >> $BOOTDIR/extlinux/extlinux.conf
      fi
    fi

    echo "DEFAULT $ROOTFS" >> $BOOTDIR/extlinux/extlinux.conf
    echo "LABEL $ROOTFS" >> $BOOTDIR/extlinux/extlinux.conf
    echo "KERNEL $BOOTPATH/$VMLINUZ" >> $BOOTDIR/extlinux/extlinux.conf
    echo "INITRD $BOOTPATH/$ROOTFS.gz" >> $BOOTDIR/extlinux/extlinux.conf
    echo "APPEND quiet waitusb=5:"$TARGETUUID" tce="$TARGETUUID" " >> $BOOTDIR/extlinux/extlinux.conf

    if [ -n "$LOCALOS" ]; then
      if [ "$TYPE" == "frugal" ] && [ "$MARKACTIVE" == "1" ]; then
        LC_PART=$(echo $LOCALOS | cut -d ' ' -f 1 | grep -o [[:digit:]])
        LC_OS=$(echo $LOCALOS | cut -d ' ' -f 2)
        echo "" >> $BOOTDIR/extlinux/extlinux.conf
        if [ "$LC_OS" = "windows" ]; then
          echo "LABEL windows" >> $BOOTDIR/extlinux/extlinux.conf
        fi
        if [ "$LC_OS" = "fat16" ]; then
          echo "LABEL fat16" >> $BOOTDIR/extlinux/extlinux.conf
          echo "MENU LABEL Bootable FAT16" >> $BOOTDIR/extlinux/extlinux.conf
        fi
        if [ "$LC_OS" = "linux" ]; then
          mkdir -p /mnt/linux
          if mounted /mnt/linux; then umount /mnt/linux; fi
          mount $(echo $LOCALOS | cut -d ' ' -f 1) /mnt/linux
          DISTRO="$(cat /mnt/linux/etc/*-release 2> /dev/null)"
          echo "LABEL linux" >> $BOOTDIR/extlinux/extlinux.conf
          [ -n "$DISTRO" ] && {
            echo "$DISTRO" | grep -q PRETTY_NAME && NAME=$(echo "$DISTRO" | grep PRETTY_NAME | cut -d '=' -f 2) || {
              echo "$DISTRO" | grep -q "^NAME" && NAME=$(echo "$DISTRO" | grep "^NAME" | cut -d '=' -f 2) || {
                [ `echo "$DISTRO" | sort -u | wc -l` = 1 ] && NAME=$(echo "$DISTRO" | sort -u) || NAME="Unknown Linux"
              }
            }
          } || {
            NAME="Unknown Linux"
          }
          echo "MENU LABEL $NAME" >> $BOOTDIR/extlinux/extlinux.conf
          umount /mnt/linux
        fi
        if [ "$LC_OS" = "unknown" ]; then
          echo "LABEL unknown" >> $BOOTDIR/extlinux/extlinux.conf
          echo "MENU LABEL Unknown OS" >> $BOOTDIR/extlinux/extlinux.conf
        fi
        echo "COM32 chain.c32" >> $BOOTDIR/extlinux/extlinux.conf
        echo "APPEND boot ${LC_PART}" >> $BOOTDIR/extlinux/extlinux.conf
      fi
    fi

    sync; sleep 1
    sed -i s"~quiet ~quiet $OPTIONS ~" $BOOTDIR/extlinux/extlinux.conf
  fi

  [ -f /mnt/drive/tce/${MYDATA}.tgz ] || touch /mnt/drive/tce/${MYDATA}.tgz
  sync; sleep 1
  umount /mnt/drive
}
