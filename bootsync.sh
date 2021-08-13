#!/bin/sh
# put other system startup commands here, the boot process will wait until they complete.
# Use bootlocal.sh for system startup commands that can run in the background
# and therefore not slow down the boot process.

TARGET="/dev/sda"
VMLINUZ="vmlinuz"
ROOTFS="core"
BUILD="x86"
USB="/mnt/sdb"
BOOT="$USB/boot"
FORMAT="ext3"
KERNELVER=$(uname -r)
MOUNTDIR="target"
MOUNT="/mnt/$MOUNTDIR"
#core
INSTALL="i"
INTERACTIVE="y"
VMLINUZ="vmlinuz"
ROOTFS="core"
TYPE="frugal"
COREPLUS="yes"
BOOTLOADER="yes"
DEVICE="sda"
CTARGET="$DEVICE"1
XBASE="$(cat $BOOT/../cde/xbase.lst)"
BOOTDIR="/mnt/$MOUNTDIR/boot"
BOOTPATH="/boot"



out() {
 sync; sync
 poweroff
}

pause() {
    sleep 3
}

checkroot() {
 if [ `/usr/bin/id -u` -ne 0 ]; then
   echo "Need root privileges." >&2
   exit 1
 fi
}

# Check for the root access
checkroot

# Check there is a disk
fdisk -l $TARGET 2>&1 | grep -q bytes
[ "$?" -ne 0 ] && echo "No disk found" && \
 sleep 10 && out

# Check Mounted
#grep -q ^/dev/"$DEVICE" /etc/mtab
#if [ "$?" == 0  ]; then
#  echo "$DEVICE appears to have a partition already mounted!"
#  echo "Check if correct device, if so,  umount it and then"
#  echo "run installer again."
#  pause
#  out
#fi

mkdir -p $USB
mount /dev/sdb $USB

# Partition setup
dd if=/dev/zero of=$TARGET bs=1k count=1 > /dev/null 2>&1 &
cd /

# attempt unmount
fuser -k -9 $TARGET
fuser -k -9 /mnt/sda1
fuser -k -9 /mnt/sda
fuser -k -9 /dev/sda1
sleep 5
umount /mnt/sda1 || true
umount -f /mnt/sda1 || true
#umount -l $TARGET || true
sleep 5


echo "Writing zero's to beginning of /dev/$DEVICE"
dd if=/dev/zero of=$TARGET bs=1k count=1 > /dev/null 2>&1 &
sleep 1
echo "Partitioning /dev/$DEVICE"
fdisk $TARGET << EOF
n
p
1


a
1
t
83
p
w
EOF

pause

# Frugal Setup
echo "Formatting $TARGET"
mkfs.ext3 ${TARGET}1
pause
dd if=/usr/local/share/syslinux/mbr.bin of=${TARGET} bs=440 count=1
pause
rebuildfstab
grep -q ^/dev/"$DEVICE" /etc/mtab
if [ "$?" == 0  ]; then
  echo "$DEVICE appears to have a partition already mounted!"
  echo "Check if correct device, if so,  umount it and then"
  echo "run installer again."
  sh
  pause
fi

#Mount
mkdir /mnt/target
mount ${TARGET}1 /mnt/target
cd /mnt/target

#ext linux setup
echo "Applying extlinux."
mkdir -p $BOOTDIR/extlinux
extlinux -i $BOOTDIR/extlinux
cp  $BOOT/$VMLINUZ ${BOOTDIR}/
cp  $BOOT/"$ROOTFS".gz ${BOOTDIR}/

#copy tce
cd /mnt/target
cp -rfv ${USB}/cde .
cp -rfv ${USB}/app .
ls -lart
pause
mv cde tce
pause
cp -rfv ${USB}/ydata.tgz mydata.tgz
cp -rfv ${USB}/extlinux.conf $BOOTDIR/extlinux/extlinux.conf
cp -rfv /usr/local/share/syslinux/vesamenu.c32 $BOOTDIR/extlinux/
cp -rfv /usr/local/share/syslinux/chain.c32 $BOOTDIR/extlinux/
cp -rfv /usr/local/share/syslinux/libcom32.c32 $BOOTDIR/extlinux/
cp -rfv /usr/local/share/syslinux/libutil.c32 $BOOTDIR/extlinux/
chown -R tc.staff /mnt/target/tce 2>/dev/null
chmod -R u+w /mnt/drive/target 2>/dev/null
chmod a+rwx /mnt/target/mydata.tgz
ls -lart
pause

cd /
umount /mnt/target
# Done!
clear
echo "Success."
pause
out

###################################

/usr/bin/sethostname yantra
/opt/bootlocal.sh &
