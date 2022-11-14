# TP6 : Stockage et sauvegarde
Le principe du TP : mettre en place des sauvegardes automatisées pour les données de NextCloud.
> En lien avec le [TP5](https://github.com/UnEpicier/TP-Linux/tree/main/TP5)

pour ce TP, nous aurons 3 VM:

| Machine          | IP               | Service               |
|:----------------:|:----------------:|:---------------------:|
| web.tp6.linux    | `10.5.1.11/24`   | Serveur Web: Apache   |
| db.tp6.linux     | `10.5.1.12/24`   | Serveur BDD: MariaDB  |
| backup.tp6.linux | `10.5.1.13/24`   | Serveur de sauvegarde |

## Partie 1 : Préparation de la machine `backup.tp6.linux`
### I. Ajout de disque
Dans un premier temps, nous ajouton un second disque de dur de 5Go à notre machine.
```sh
$ lsblk | grep sdb
NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sdb           8:16   0    5G  0 disk
```

### Partitioning
#### ➜ Création de la partition
Création d'un *physical volume (PV)*
```sh
$ sudo pvcreate /dev/sdb
  Physical volume "/dev/sdb" successfully created.

$ sudo pvs
  PV         VG Fmt  Attr PSize  PFree
  /dev/sda2  rl lvm2 a--  <7.00g    0 
  /dev/sdb      lvm2 ---   5.00g 5.00g

$ sudo pvdisplay
  --- Physical volume ---
  PV Name               /dev/sda2
  VG Name               rl
  PV Size               <7.00 GiB / not usable 3.00 MiB
  Allocatable           yes (but full)
  PE Size               4.00 MiB
  Total PE              1791
  Free PE               0
  Allocated PE          1791
  PV UUID               Jk0zo5-cuIL-IKSl-QNxI-sagM-H3OJ-UxEks1
   
  "/dev/sdb" is a new physical volume of "5.00 GiB"
  --- NEW Physical volume ---
  PV Name               /dev/sdb
  VG Name               
  PV Size               5.00 GiB
  Allocatable           NO
  PE Size               0   
  Total PE              0
  Free PE               0
  Allocated PE          0
  PV UUID               hWKWCT-HuNN-mWRN-fT6v-A2xt-q8Nz-hqPnnG
```
Création d'un *volume group (VG)*
```sh
$ sudo vgcreate backup /dev/sdb
  Volume group "backup" successfully created

$ sudo vgs
  VG     #PV #LV #SN Attr   VSize  VFree 
  backup   1   0   0 wz--n- <5.00g <5.00g

$ sudo vgdisplay
  --- Volume group ---
  VG Name               backup
  System ID             
  Format                lvm2
  Metadata Areas        1
  Metadata Sequence No  1
  VG Access             read/write
  VG Status             resizable
  MAX LV                0
  Cur LV                0
  Open LV               0
  Max PV                0
  Cur PV                1
  Act PV                1
  VG Size               <5.00 GiB
  PE Size               4.00 MiB
  Total PE              1279
  Alloc PE / Size       0 / 0   
  Free  PE / Size       1279 / <5.00 GiB
  VG UUID               k6mK9Y-cuVL-rtvn-lzzS-hj9D-sCfR-2nwpdT
```
Création d'un *logical volume (LV)*
```sh
$ sudo lvcreate -l 100%FREE backup -n backup
  Logical volume "backup" created.

$ sudo lvs
  LV     VG     Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  backup backup -wi-a-----  <5.00g                                                    
  root   rl     -wi-ao----  <6.20g                                                    
  swap   rl     -wi-ao---- 820.00m

$ sudo lvdisplay
  --- Logical volume ---
  LV Path                /dev/backup/backup
  LV Name                backup
  VG Name                backup
  LV UUID                AtXcXj-0gbk-JdtR-spl3-eREA-6Gud-V2IvpT
  LV Write Access        read/write
  LV Creation host, time backup.tp6.linux, 2021-12-04 15:30:18 +0100
  LV Status              available
  # open                 0
  LV Size                <5.00 GiB
  Current LE             1279
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     8192
  Block device           253:2
```
#### ➜ Formatage de la partition
```sh
$ sudo mkfs -t ext4 /dev/backup/backup
mke2fs 1.45.6 (20-Mar-2020)
Creating filesystem with 1309696 4k blocks and 327680 inodes
Filesystem UUID: 46a0acd8-924d-4464-93fc-344b7437aa63
Superblock backups stored on blocks: 
        32768, 98304, 163840, 229376, 294912, 819200, 884736

Allocating group tables: done                            
Writing inode tables: done                            
Creating journal (16384 blocks): done
Writing superblocks and filesystem accounting information: done
```
#### ➜ Montage de la partition
Montage de la partition
```sh
$ sudo mkdir /backup
$ sudo mount /dev/backup/backup /backup/
$ mount | grep backup
/dev/mapper/backup-backup on /backup type ext4 (rw,relatime,seclabel)

$ df -h | grep backup
Filesystem                 Size  Used Avail Use% Mounted on
/dev/mapper/backup-backup  4.9G   20M  4.6G   1% /backup

$ ls -l / | grep backup
drwxr-xr-x.   3 root root 4096 Dec  4 15:32 backup
# r => Read et w => Write donc on est bon
```
Définition du montage automatique de la partition
```sh
$ sudo nano /etc/fstab
$ sudo umount /backup

$ sudo mount -av
/                        : ignored
/boot                    : already mounted
none                     : ignored
mount: /backup does not contain SELinux labels.
       You just mounted an file system that supports labels which does not
       contain labels, onto an SELinux box. It is likely that confined
       applications will generate AVC messages and not be allowed access to
       this file system.  For more details see restorecon(8) and mount(8).
/backup                  : successfully mounted

$ sudo restorecon -R /backup
$ sudo umount /backup
$ sudo mount -av
/                        : ignored
/boot                    : already mounted
none                     : ignored
/backup                  : successfully mounted
```

## Partie 2 : Setup du serveur NFS sur `backup.tp6.linux`
#### ➜ Préparation des dossiers
```sh
$ sudo mkdir /backup/web.tp6.linux /backup/db.tp6.linux
$ ls /backup/
db.tp6.linux  lost+found  web.tp6.linux
```

#### ➜ Install NFS
```sh
$ sudo dnf install nfs-utils
```

#### ➜ Conf du serveur NFS
```sh
$ sudo nano /etc/idmapd.conf
$ cat /etc/idmapd.conf | grep "Domain ="
Domain = tp6.linux

$ sudo nano /etc/exports
$ cat /etc/exports
/backup/web.tp6.linux 10.5.1.11/24(rw,no_root_squash)
/backup/db.tp6.linux 10.5.1.12/24(rw,no_root_squash)
```
L'option `rw` indique que l'utilisateur a les droits de lecture et d'écriture.
L'option `no_root_squash` indique que l'utilisateur a les droits de root sur le répertoire partagé.

#### ➜ Démarrage
```sh
$ sudo systemctl start nfs-server

$ systemctl status nfs-server
● nfs-server.service - NFS server and services
   Loaded: loaded (/usr/lib/systemd/system/nfs-server.service; enabled; vendor preset: disabled)
  Drop-In: /run/systemd/generator/nfs-server.service.d
           └─order-with-mounts.conf
   Active: active (exited) since Sat 2021-12-04 16:00:07 CET; 40s ago

$ sudo systemctl enable nfs-server
Created symlink /etc/systemd/system/multi-user.target.wants/nfs-server.service → /usr/lib/systemd/system/nfs-server.service.
```

#### ➜ Firewall
```sh
$ sudo firewall-cmd --add-port=2049/tcp --permanent
success

$ sudo firewall-cmd --reload
success

$ sudo firewall-cmd --list-ports
2049/tcp

$ sudo ss -ltunp | grep 2049
Netid        State         Recv-Q        Send-Q               Local Address:Port
tcp          LISTEN 0      64            0.0.0.0:2049         0.0.0.0:*
tcp          LISTEN 0      64            [::]:2049            [::]:*
```

## Partie 3 : Setup des clients NFS sur `web.tp6.linux` et `db.tp6.linux`
#### ➜ Install
```sh
$ sudo dnf install nfs-utils
```

#### ➜ Conf
```sh
$ sudo nano /etc/idmapd.conf

$ cat /etc/idmapd.conf | grep "Domain ="
Domain = tp6.linux
```

#### ➜ Montage
```sh
$ sudo mkdir /srv/backup

$ sudo mount -t nfs 10.5.1.13:/backup/web.tp6.linux /srv/backup

$ ls -l /srv/backup/ | grep web.tp6.linux
drwxr-xr-x.   3 root root 4096 Dec  4 15:32 web.tp6.linux 
# r => Read et w => Write donc on est bon

$ sudo nano /etc/fstab
$ sudo umount /backup/web.tp6.linux

$ sudo mount -av
/                        : ignored
/boot                    : already mounted
none                     : ignored
mount: /backup does not contain SELinux labels.
       You just mounted an file system that supports labels which does not
       contain labels, onto an SELinux box. It is likely that confined
       applications will generate AVC messages and not be allowed access to
       this file system.  For more details see restorecon(8) and mount(8).
/backup/web.tp6.linux    : successfully mounted
```

#### ➜ Pareil sur `db.tp6.linux`
```sh
$ sudo dnf install nfs-utils

$ sudo nano /etc/idmapd.conf

$ cat /etc/idmapd.conf | grep "Domain ="
Domain = tp6.linux

$ sudo mkdir /srv/backup

$ sudo mount -t nfs 10.5.1.13:/backup/db.tp6.linux /srv/backup

$ ls -l /srv/backup/ | grep db.tp6.linux
drwxr-xr-x.   3 root root 4096 Dec  4 15:32 db.tp6.linux 
# r => Read et w => Write donc on est bon

$ sudo nano /etc/fstab
$ sudo umount /backup/db.tp6.linux

$ sudo mount -av
/                        : ignored
/boot                    : already mounted
none                     : ignored
mount: /backup does not contain SELinux labels.
       You just mounted an file system that supports labels which does not
       contain labels, onto an SELinux box. It is likely that confined
       applications will generate AVC messages and not be allowed access to
       this file system.  For more details see restorecon(8) and mount(8).
/backup/db.tp6.linux    : successfully mounted
```