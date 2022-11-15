# TP1 : (re)Familiaration avec un système GNU/Linux

## Sommaire

- [0. Préparation de la machine](#0-préparation-de-la-machine)
- [I. Création et configuration](#1-création-et-configuration)
- [1. Interaction avec un service existant](#1-interaction-avec-un-service-existant)

## 0. Préparation de la machine

🌞 Setup de deux machines Rocky Linux configurées de façon basique.

- Un accès internet (via la carte NAT)

```sh
[unepicier@localhost ~]$ ping 1.1.1.1 -c 4
PING 1.1.1.1 (1.1.1.1) 56(84) bytrs of data.
64 bytes from 1.1.1.1: icmp_seq=1 ttl=54 time=26.4ms
64 bytes from 1.1.1.1: icmp_seq=2 ttl=54 time=26.4ms
64 bytes from 1.1.1.1: icmp_seq=3 ttl=54 time=26.4ms
64 bytes from 1.1.1.1: icmp_seq=4 ttl=54 time=26.4ms

--- 1.1.1.1 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 2000ms
rtt min/avg/max/mdev = 23.565/24.740/26.392/1.202 ms
```

- Un accès à un réseau local

```sh
[unepicier@localhost ~]$ sudo vi /etc/sysconfig/network-scripts/ifcfg-enp0s8
DEVICE=enp0s8

BOOTPROTO=static
ONBOOT=yes

IPADDR=10.101.1.11
NETMASK=255.255.255.0

[unepicier@localhost ~]$ sudo sytemctl restartNetworkManager
[unepicier@localhost ~]$ ip a
```

Pour la seconde machine on écrira `IPADDR=10.101.1.12`

- Vous n'utilisez que ssh pour administrer les machines

```sh
$ ssh 10.101.1.11 -l unepicier
$ ssh 10.101.1.12 -l unepicier
```

- Les machines doivent avoir un nom

```sh
[unepicier@localhost ~]$ sudo hostname node1.tp1.b2
[unepicier@localhost ~]$ sudo vi /etc/hostname
node1.tp1.b2
```

Puis sur l'autre machine:

```sh
[unepicier@localhost ~]$ sudo hostname node2.tp1.b2
[unepicier@localhost ~]$ sudo vi /etc/hostname
node2.tp1.b2
```

Puis après un reboot, on peut voir `[unepicier@node1 ~]$` et `[unepicier@node2 ~]$`

- Utiliser 1.1.1.1 comme serveur DNS

```sh
[unepicier@node1 ~]$ sudo cat /etc/resolv.conf
nameserver 1.1.1.1

[unepicier@node1 ~]$ dig ynov.com

```

- Les machines doivent pouvoir se joindre par leurs noms respectifs

```sh
[unepicier@node1 ~]$ sudo vi /etc/hosts
[unepicier@node1 ~]$ sudo cat /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
10.101.1.12 node2.tp1.b2

[unepicier@node1 ~]$ ping node2.tp1.b2 -c 4
PING node2.tp1.b2 (10.101.1.12) 56(84) bytes of data.
64 bytes from node2.tp1.b2 (10.101.1.12): icmp_seq=1 ttl=64 time=0.240 ms
64 bytes from node2.tp1.b2 (10.101.1.12): icmp_seq=2 ttl=64 time=0.318 ms
64 bytes from node2.tp1.b2 (10.101.1.12): icmp_seq=3 ttl=64 time=0.299 ms
64 bytes from node2.tp1.b2 (10.101.1.12): icmp_seq=4 ttl=64 time=0.311 ms

--- node2.tp1.b2 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3085ms
rtt min/avg/max/mdev = 0.240/0.292/0.318/0.030 ms
```

- Le pare-feu est configuré pour bloquer toutes les connexions exceptées celles qui sont nécessaires

Firewalld étant déjà installé, on regarde d'abord qu'il n'y a aucun port d'autorisé puis on autorise ceux qui sont nécessaires.

```sh
[unepicier@node1 ~]$ sudo firewall-cmd --list-ports

[unepicier@node1 ~]$ sudo firewall-cmd --add-port=22/tcp --permanent
[unepicier@node1 ~]$ sudo systemctl restart firewalld
[unepicier@node1 ~]$ sudo firewall-cmd --list-ports
22/tcp
```

## I. Utilisateurs

### 1. Création et configuration

🌞 Ajouter un utilisateur à la machine

Cet utilisateur se nommera donc `admin` et aura comme mot de passe `admin`

```sh
[unepicier@node1 ~]$ sudo useradd admin -m -d /home/admin -s /bin/bash
[unepicier@node1 ~]$ sudo passwd admin
New password:
Retype new password:
passwd: all authentication tokens updated successfully
```

On a donc bien créé l'utilisateur et maintenant il faut vérifier que tout est correct

```
[unepicier@node1 ~]$ su - admin
[admin@node1 unepicier]$ cd
[admin@node1 ~]$ pwd ~
/home/admin
[admin@node1 ~]$ grep admin /etc/passwd
admin:x:1001:1001::/home/admin:/bin/bash
```

🌞 Créer un nouveau groupe `admins`

```sh
[unepicier@node1 ~]$ sudo groupadd admins
[unepicier@node1 ~]$ sudo visudo
[unepicier@node1 ~]$ sudo grep admins /etc/sudoers
%admins ALL=(ALL)       ALL
```

🌞 Ajouter votre utilisateur à ce groupe `admins`

```sh
[unepicier@node1 ~]$ sudo usermod -aG admins admin
```

Puis on vérifie

```sh
[unepicier@node1 ~]$ su - admin
[admin@node1 ~]$ groups
admin admins
[admin@node1 ~]$ grep wheel /etc/sudoers
grep: /etc/sudoers: Permission denied
[admin@node1 ~]$ sudo grep wheel /etc/sudoers
## Allows people in group wheel to run all commands
%wheel  ALL=(ALL)       ALL
# %wheel        ALL=(ALL)       NOPASSWD: ALL
```

### 2. SSH

🌞 Pour cela...

**En local**
On génère la clé:

```sh
$ ssh-keygen -t rsa -b 4096
Generating public/private rsa key pair.
Enter file in which to save the key (C:\Users\alexi/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in C:\Users\alexi/.ssh/id_rsa
Your public key has been saved in C:\Users\alexi/.ssh/id_rsa.pub
```

Je n'ai pas sur Windows `ssh-copy-id` mais son équivalent (basique) est :

```sh
$ cat ~/.ssh/id_rsa.pub | ssh admin@10.101.1.11 "cat >> ~/.ssh/authorized_keys"
```

**Sur la machine**
On vérifie que ça ai bien fonctionné:

```sh
[admin@node1 ~]$ cat .ssh/authorized_keys
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDJYOEf7RJ2EfMsf4/gt0PtBXj/N15OdwEcCeO4r+xydaazl49vq8YGcM8dY9IYIeHxHA01zUiCVowdGPWesCV6gOoTv9HXN9bnmlvfzemF4XGvbDy7XZ/w5V4lOs8qrWyPIFmz9vP+LcrO8OywvYQBHC+jRTPxjsvPXyUr6vnMucJ4189B7klOYtcM02MLOvt6VAFzKkJ24GJ3oXtCjq+ouTsyaZbL3VtrzBruhi421I19PhplrtTqGwLSWvPEHnroEkeXpuYgsv0qgVoOt6JkjKHz051KkA0G+WJPOzeapegYNAAh9bC464Bn4tK4kvI/i/ZInzhN6gTMeBqBZvimz1kxcYQ1gASVKZs+jeRIIi24oII4Otj0MEMdeHfMPoCg9TAGyRMfadWZV09Sn7r1FjTOHVZw5K0Y7DPOWKuZG1miuAHlbIcHC3SSdWVYYesH5BoKFtKkfzshpdQPygohOs+B83wSkhzgiOA3sUHzd7XSFZT+NdYaN/oN+Sp8m4l2Ls9KoefWeYRXQMUBgDK0QIbMlclbKukwpmSVmrtMwT4KtXGefD2EHBgr74CcTwR2VKnzSHzCKfccpY6KsUaG3xSP9Kx/9ZwcWT9D52kH8DYqk4WlRs3u1YhjLzzdr0abSbCeXU8M5Ov3uyDn5DhEZBiAxDT0FoEKLa+xnMoHdQ== alexi@Artemis
```

🌞 Assurez vous que la connexion SSH est fonctionnelle, sans avoir besoin de mot de passe.

```sh
$ ssh admin@10.101.1.11
[admin@node1 ~]$
```

## II. Partitionnement

### 2. Partitionnement

🌞 Utilisez LVM pour...

- Agréger les deux disques en un seul volume group
- Créer 3 logical volumes de 1 Go chacun
- Formater ces partitions en ext4
- Monter ces partitions pour qu'elles soient accessibles aux points de montage /mnt/part1, /mnt/part2 et /mnt/part3

D'abord, on ajoute les deux disques en tant que PV

```sh
[unepicier@node1 ~]$ lsblk | grep 3G
sdb           8:16   0    3G  0 disk
sdc           8:32   0    3G  0 disk
[unepicier@node1 ~]$ sudo pvcreate /dev/sdb
  Physical volume "/dev/sdb" successfully created.
[unepicier@node1 ~]$ sudo pvcreate /dev/sdc
  Physical volume "/dev/sdc" successfully created.
```

On vérifie:

```sh
[unepicier@node1 ~]$ sudo pvs
  Devices file sys_wwid t10.ATA_____VBOX_HARDDISK___________________________VB6b095960-372fbcb6_ PVID OsaS5eSBnYWJj3pJPV3Lbz3Acx1ccZOq last seen on /dev/sda2 not found.
  PV         VG Fmt  Attr PSize PFree
  /dev/sdb      lvm2 ---  3.00g 3.00g
  /dev/sdc      lvm2 ---  3.00g 3.00g

[unepicier@node1 ~]$ sudo pvdisplay
  Devices file sys_wwid t10.ATA_____VBOX_HARDDISK___________________________VB6b095960-372fbcb6_ PVID OsaS5eSBnYWJj3pJPV3Lbz3Acx1ccZOq last seen on /dev/sda2 not found.
  "/dev/sdb" is a new physical volume of "3.00 GiB"
  --- NEW Physical volume ---
  PV Name               /dev/sdb
  VG Name
  PV Size               3.00 GiB
  Allocatable           NO
  PE Size               0
  Total PE              0
  Free PE               0
  Allocated PE          0
  PV UUID               PBHkqc-GyBe-hOk0-TXBQ-6hwB-CT47-ZDcxOQ

  "/dev/sdc" is a new physical volume of "3.00 GiB"
  --- NEW Physical volume ---
  PV Name               /dev/sdc
  VG Name
  PV Size               3.00 GiB
  Allocatable           NO
  PE Size               0
  Total PE              0
  Free PE               0
  Allocated PE          0
  PV UUID               u8bDgd-a8HS-f3RN-jgxX-Vt4n-KIC1-wWZ7W6
```

Ensuite on créer un VG:

```sh
[unepicier@node1 ~]$ sudo vgcreate data /dev/sdb
  Volume group "data" successfully created
[unepicier@node1 ~]$ sudo vgextend data /dev/sdc
  Volume group "data" successfully extended
```

On vérifie:

```sh
[unepicier@node1 ~]$ sudo vgs
  Devices file sys_wwid t10.ATA_____VBOX_HARDDISK___________________________VB6b095960-372fbcb6_ PVID OsaS5eSBnYWJj3pJPV3Lbz3Acx1ccZOq last seen on /dev/sda2 not found.
  VG   #PV #LV #SN Attr   VSize VFree
  data   2   0   0 wz--n- 5.99g 5.99g
[unepicier@node1 ~]$ sudo vgdisplay
  Devices file sys_wwid t10.ATA_____VBOX_HARDDISK___________________________VB6b095960-372fbcb6_ PVID OsaS5eSBnYWJj3pJPV3Lbz3Acx1ccZOq last seen on /dev/sda2 not found.
  --- Volume group ---
  VG Name               data
  System ID
  Format                lvm2
  Metadata Areas        2
  Metadata Sequence No  2
  VG Access             read/write
  VG Status             resizable
  MAX LV                0
  Cur LV                0
  Open LV               0
  Max PV                0
  Cur PV                2
  Act PV                2
  VG Size               5.99 GiB
  PE Size               4.00 MiB
  Total PE              1534
  Alloc PE / Size       0 / 0
  Free  PE / Size       1534 / 5.99 GiB
  VG UUID               1SrgBD-5qNr-jQek-c0bx-I0ub-0idE-cqBkMC
```

Ensuite on créer les 3 LV de 1 Go chacun:

```sh
[unepicier@node1 ~]$ sudo lvcreate -L 1G data -n data1
  Logical volume "data1" created.
[unepicier@node1 ~]$ sudo lvcreate -L 1G data -n data2
  Logical volume "data2" created.
[unepicier@node1 ~]$ sudo lvcreate -L 1G data -n data3
  Logical volume "data3" created.
```

On vérifie:

```sh
[unepicier@node1 ~]$ sudo lvs
  Devices file sys_wwid t10.ATA_____VBOX_HARDDISK___________________________VB6b095960-372fbcb6_ PVID OsaS5eSBnYWJj3pJPV3Lbz3Acx1ccZOq last seen on /dev/sda2 not found.
  LV    VG   Attr       LSize Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  data1 data -wi-a----- 1.00g
  data2 data -wi-a----- 1.00g
  data3 data -wi-a----- 1.00g
[unepicier@node1 ~]$ sudo lvdisplay
  Devices file sys_wwid t10.ATA_____VBOX_HARDDISK___________________________VB6b095960-372fbcb6_ PVID OsaS5eSBnYWJj3pJPV3Lbz3Acx1ccZOq last seen on /dev/sda2 not found.
  --- Logical volume ---
  LV Path                /dev/data/data1
  LV Name                data1
  VG Name                data
  LV UUID                USfrdn-iDCa-a5iK-7JMX-daIi-St2A-UdmpaR
  LV Write Access        read/write
  LV Creation host, time node1.tp1.b2, 2022-11-14 16:43:23 +0100
  LV Status              available
  # open                 0
  LV Size                1.00 GiB
  Current LE             256
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           253:2

  --- Logical volume ---
  LV Path                /dev/data/data2
  LV Name                data2
  VG Name                data
  LV UUID                qjeXqX-8vnj-eaO5-1whl-YH5u-9OaC-6ARcrZ
  LV Write Access        read/write
  LV Creation host, time node1.tp1.b2, 2022-11-14 16:43:29 +0100
  LV Status              available
  # open                 0
  LV Size                1.00 GiB
  Current LE             256
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           253:3

  --- Logical volume ---
  LV Path                /dev/data/data3
  LV Name                data3
  VG Name                data
  LV UUID                CRChZR-rRWD-wpW2-Ggbr-4duo-a5Ht-ddDk4M
  LV Write Access        read/write
  LV Creation host, time node1.tp1.b2, 2022-11-14 16:43:35 +0100
  LV Status              available
  # open                 0
  LV Size                1.00 GiB
  Current LE             256
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           253:4
```

On formatte ensuite ces partitions en `ext4`:

```sh
[unepicier@node1 ~]$ sudo mkfs -t ext4 /dev/data/data1
mke2fs 1.46.5 (30-Dec-2021)
Creating filesystem with 262144 4k blocks and 65536 inodes
Filesystem UUID: 12cce2af-c126-44eb-ac4d-46f9a4b9141b
Superblock backups stored on blocks:
        32768, 98304, 163840, 229376

Allocating group tables: done
Writing inode tables: done
Creating journal (8192 blocks): done
Writing superblocks and filesystem accounting information: done

[unepicier@node1 ~]$ sudo mkfs -t ext4 /dev/data/data2
mke2fs 1.46.5 (30-Dec-2021)
Creating filesystem with 262144 4k blocks and 65536 inodes
Filesystem UUID: dffd082e-38ee-4a27-aa67-28aa019797c7
Superblock backups stored on blocks:
        32768, 98304, 163840, 229376

Allocating group tables: done
Writing inode tables: done
Creating journal (8192 blocks): done
Writing superblocks and filesystem accounting information: done

[unepicier@node1 ~]$ sudo mkfs -t ext4 /dev/data/data3
mke2fs 1.46.5 (30-Dec-2021)
Creating filesystem with 262144 4k blocks and 65536 inodes
Filesystem UUID: c900b363-16e6-42f7-8b72-aca2c4fe0efd
Superblock backups stored on blocks:
        32768, 98304, 163840, 229376

Allocating group tables: done
Writing inode tables: done
Creating journal (8192 blocks): done
Writing superblocks and filesystem accounting information: done
```

Et enfin on monte ces 3 partitions:

```sh
[unepicier@node1 ~]$ sudo mkdir /mnt/part1 /mnt/part2 /mnt/part3
[unepicier@node1 ~]$ sudo mount /dev/data/data1 /mnt/part1
[unepicier@node1 ~]$ sudo mount /dev/data/data2 /mnt/part2
[unepicier@node1 ~]$ sudo mount /dev/data/data3 /mnt/part3
```

On vérifie:

```sh
[unepicier@node1 ~]$ mount
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime,seclabel)
devtmpfs on /dev type devtmpfs (rw,nosuid,seclabel,size=472532k,nr_inodes=118133,mode=755,inode64)
securityfs on /sys/kernel/security type securityfs (rw,nosuid,nodev,noexec,relatime)
tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev,seclabel,inode64)
devpts on /dev/pts type devpts (rw,nosuid,noexec,relatime,seclabel,gid=5,mode=620,ptmxmode=000)
tmpfs on /run type tmpfs (rw,nosuid,nodev,seclabel,size=196728k,nr_inodes=819200,mode=755,inode64)
cgroup2 on /sys/fs/cgroup type cgroup2 (rw,nosuid,nodev,noexec,relatime,seclabel,nsdelegate,memory_recursiveprot)
pstore on /sys/fs/pstore type pstore (rw,nosuid,nodev,noexec,relatime,seclabel)
none on /sys/fs/bpf type bpf (rw,nosuid,nodev,noexec,relatime,mode=700)
/dev/mapper/rl-root on / type xfs (rw,relatime,seclabel,attr2,inode64,logbufs=8,logbsize=32k,noquota)
selinuxfs on /sys/fs/selinux type selinuxfs (rw,nosuid,noexec,relatime)
systemd-1 on /proc/sys/fs/binfmt_misc type autofs (rw,relatime,fd=36,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=17301)
hugetlbfs on /dev/hugepages type hugetlbfs (rw,relatime,seclabel,pagesize=2M)
mqueue on /dev/mqueue type mqueue (rw,nosuid,nodev,noexec,relatime,seclabel)
debugfs on /sys/kernel/debug type debugfs (rw,nosuid,nodev,noexec,relatime,seclabel)
tracefs on /sys/kernel/tracing type tracefs (rw,nosuid,nodev,noexec,relatime,seclabel)
fusectl on /sys/fs/fuse/connections type fusectl (rw,nosuid,nodev,noexec,relatime)
configfs on /sys/kernel/config type configfs (rw,nosuid,nodev,noexec,relatime)
/dev/sda1 on /boot type xfs (rw,relatime,seclabel,attr2,inode64,logbufs=8,logbsize=32k,noquota)
tmpfs on /run/user/1000 type tmpfs (rw,nosuid,nodev,relatime,seclabel,size=98364k,nr_inodes=24591,mode=700,uid=1000,gid=1000,inode64)
/dev/mapper/data-data1 on /mnt/part1 type ext4 (rw,relatime,seclabel)
/dev/mapper/data-data2 on /mnt/part2 type ext4 (rw,relatime,seclabel)
/dev/mapper/data-data3 on /mnt/part3 type ext4 (rw,relatime,seclabel)

[unepicier@node1 ~]$ df -h
Filesystem              Size  Used Avail Use% Mounted on
devtmpfs                462M     0  462M   0% /dev
tmpfs                   481M     0  481M   0% /dev/shm
tmpfs                   193M  3.0M  190M   2% /run
/dev/mapper/rl-root     6.2G  1.1G  5.2G  18% /
/dev/sda1              1014M  210M  805M  21% /boot
tmpfs                    97M     0   97M   0% /run/user/1000
/dev/mapper/data-data1  974M   24K  907M   1% /mnt/part1
/dev/mapper/data-data2  974M   24K  907M   1% /mnt/part2
/dev/mapper/data-data3  974M   24K  907M   1% /mnt/part3
```

🌞 Grâce au fichier /etc/fstab, faites en sorte que cette partition soit montée automatiquement au démarrage du système.

```sh
[unepicier@node1 ~]$ sudo vim /etc/fstab
[unepicier@node1 ~]$ sudo cat /etc/fstab

#
# /etc/fstab
# Created by anaconda on Mon Nov 14 10:43:39 2022
#
# Accessible filesystems, by reference, are maintained under '/dev/disk/'.
# See man pages fstab(5), findfs(8), mount(8) and/or blkid(8) for more info.
#
# After editing this file, run 'systemctl daemon-reload' to update systemd
# units generated from this file.
#
/dev/mapper/rl-root     /                       xfs     defaults        0 0
UUID=dadfec2c-19ab-478f-ac8a-ed5ce24e0304 /boot                   xfs     defaults        0 0
/dev/mapper/rl-swap     none                    swap    defaults        0 0
/dev/data/data1 /mnt/part1 ext4 defaults 0 0
/dev/data/data2 /mnt/part2 ext4 defaults 0 0
/dev/data/data3 /mnt/part3 ext4 defaults 0 0
```

On vérifie:

```sh
[unepicier@node1 ~]$ sudo umount /mnt/part1 /mnt/part2 /mnt/part3
[unepicier@node1 ~]$ sudo mount -av
/                        : ignored
/boot                    : already mounted
none                     : ignored
mount: /mnt/part1 does not contain SELinux labels.
       You just mounted a file system that supports labels which does not
       contain labels, onto an SELinux box. It is likely that confined
       applications will generate AVC messages and not be allowed access to
       this file system.  For more details see restorecon(8) and mount(8).
/mnt/part1               : successfully mounted
mount: /mnt/part2 does not contain SELinux labels.
       You just mounted a file system that supports labels which does not
       contain labels, onto an SELinux box. It is likely that confined
       applications will generate AVC messages and not be allowed access to
       this file system.  For more details see restorecon(8) and mount(8).
/mnt/part2               : successfully mounted
mount: /mnt/part3 does not contain SELinux labels.
       You just mounted a file system that supports labels which does not
       contain labels, onto an SELinux box. It is likely that confined
       applications will generate AVC messages and not be allowed access to
       this file system.  For more details see restorecon(8) and mount(8).
/mnt/part3               : successfully mounted
```

## III. Gestion de services

### 1. Interaction avec un service existant

🌞 Assurez-vous que...

- L'unité est démarrée
- L'unitée est activée (elle se lance automatiquement au démarrage)

```sh
● firewalld.service - firewalld - dynamic firewall daemon
     Loaded: loaded (/usr/lib/systemd/system/firewalld.service; enabled; vendor preset: enabled)
     Active: active (running) since Mon 2022-11-14 16:29:42 CET; 34min ago
       Docs: man:firewalld(1)
   Main PID: 656 (firewalld)
      Tasks: 2 (limit: 5906)
     Memory: 42.8M
        CPU: 538ms
     CGroup: /system.slice/firewalld.service
             └─656 /usr/bin/python3 -s /usr/sbin/firewalld --nofork --nopid

Nov 14 16:29:41 node1.tp1.b2 systemd[1]: Starting firewalld - dynamic firewall daemon...
Nov 14 16:29:42 node1.tp1.b2 systemd[1]: Started firewalld - dynamic firewall daemon.

[unepicier@node1 ~]$ systemctl is-enabled firewalld
enabled
```

### 2. Création de service

#### A. Unité simpliste

🌞 Créer un fichier qui définit une unité de service

```sh
[unepicier@node1 ~]$ sudo vim /etc/systemd/system/web.service
[unepicier@node1 ~]$ sudo cat /etc/systemd/system/web.service
[Unit]
Description=Very simple web service

[Service]
ExecStart=/usr/bin/python3 -m http.server 8888

[Install]
WantedBy=multi-user.target
```

On ajoute le port 8888 au firewall:

```sh
[unepicier@node1 ~]$ sudo firewall-cmd --add-port=8888/tcp --permanent
success
[unepicier@node1 ~]$ sudo systemctl restart firewalld
[unepicier@node1 ~]$ sudo firewall-cmd --list-ports
22/tcp 8888/tcp
```

🌞 Une fois le service démarré, assurez-vous que pouvez accéder au serveur web

```sh
[unepicier@node2 ~]$ curl 10.101.1.11:8888
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>Directory listing for /</title>
</head>
<body>
<h1>Directory listing for /</h1>
<hr>
<ul>
<li><a href="afs/">afs/</a></li>
<li><a href="bin/">bin@</a></li>
<li><a href="boot/">boot/</a></li>
<li><a href="dev/">dev/</a></li>
<li><a href="etc/">etc/</a></li>
<li><a href="home/">home/</a></li>
<li><a href="lib/">lib@</a></li>
<li><a href="lib64/">lib64@</a></li>
<li><a href="media/">media/</a></li>
<li><a href="mnt/">mnt/</a></li>
<li><a href="opt/">opt/</a></li>
<li><a href="proc/">proc/</a></li>
<li><a href="root/">root/</a></li>
<li><a href="run/">run/</a></li>
<li><a href="sbin/">sbin@</a></li>
<li><a href="srv/">srv/</a></li>
<li><a href="sys/">sys/</a></li>
<li><a href="tmp/">tmp/</a></li>
<li><a href="usr/">usr/</a></li>
<li><a href="var/">var/</a></li>
</ul>
<hr>
</body>
</html>
```

#### B. Modification de l'unité

🌞 Préparez l'environnement pour exécuter le mini serveur web Python

```sh
[unepicier@node2 ~]$ sudo useradd web -m -s /bin/bash
[unepicier@node2 ~]$ sudo passwd web

[unepicier@node2 ~]$ sudo mkdir /var/www
[unepicier@node2 ~]$ sudo mkdir /var/www/meow
[unepicier@node2 ~]$ sudo vim /var/www/meow/index.html
[unepicier@node2 ~]$ sudo cat /var/www/meow/index.html
<p style="margin: auto auto;font-size: 3rem;text-align: center;color: red;">Hello World!</p>

[unepicier@node1 ~]$ sudo chown -R web /var/www/meow
[unepicier@node1 ~]$ ls -al /var/www/meow/
total 4
drwxr-xr-x. 2 web  root 24 Nov 14 17:17 .
drwxr-xr-x. 3 root root 18 Nov 14 17:16 ..
-rw-r--r--. 1 web  root 96 Nov 14 17:17 index.html
```

🌞 Modifiez l'unité de service web.service créée précédemment en ajoutant les clauses

```sh
[unepicier@node1 ~]$ sudo vim /etc/systemd/system/web.service
[unepicier@node1 ~]$ sudo cat /etc/systemd/system/web.service
[Unit]
Description=Very simple web service

[Service]
ExecStart=/usr/bin/python3 -m http.server 8888
User=web
WorkingDirectory=/var/www/meow/

[Install]
WantedBy=multi-user.target

[unepicier@node1 ~]$ sudo systemctl daemon-reload
[unepicier@node1 ~]$ sudo systemctl restart web
[unepicier@node1 ~]$ systemctl status web
● web.service - Very simple web service
     Loaded: loaded (/etc/systemd/system/web.service; enabled; vendor preset: disabled)
     Active: active (running) since Mon 2022-11-14 17:31:32 CET; 15s ago
   Main PID: 1426 (python3)
      Tasks: 1 (limit: 5906)
     Memory: 9.0M
        CPU: 73ms
     CGroup: /system.slice/web.service
             └─1426 /usr/bin/python3 -m http.server 8888

Nov 14 17:31:32 node1.tp1.b2 systemd[1]: Started Very simple web service.
```

🌞 Vérifiez le bon fonctionnement avec une commande curl

Sur **`node2`**:

```sh
[unepicier@node2 ~]$ curl 10.101.1.11:8888
<p style="margin: auto auto; font-size: 3rem; text-align: center; color: red;">Hello World!</p>
```
