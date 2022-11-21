# Module 4: Sauvegarde du système de fichiers

## I. Backup

### Préparation

On se prépare en créant le dossier qui accueillera les backups et on installe au préalable le nécessaire

```sh
[unepicier@web srv]$ cd /srv
[unepicier@web srv]$ sudo touch tp3_backup.sh
[unepicier@web srv]$ sudo mkdir backup

[unepicier@web srv]$ sudo dnf install rsync -y
[unepicier@web srv]$ sudo dnf install tar -y
```

### Scripting

On écrit le script

```sh
#!/bin/bash
# Author: Vasseur Alexis
# Date: 19/11/2022 10:12
# Description: Make a backup zip from nextcloud

# Backup conf
prefix='bkp_nextcloud_'

backupDate=$(date +"%y%m%d%H%M%S")

# Turn on Maintenance On
configPath='/var/www/tp2_nextcloud/config/config.php'

sudo -u apache php81 /var/www/tp2_nextcloud/occ maintenance:mode --on
sudo -u apache sed -i -e "s/'maintenance' => false/'maintenance' => true/" $configPath

rsync -Aax /var/www/tp2_nextcloud/config/ /srv/backup/config/ && rsync -Aax /var/www/tp2_nextcloud/data/ /srv/backup/data/ && rsync -Aax /var/www/tp2_nextcloud/themes /srv/backup/themes

if [[ $? == 0 ]]
then
        cd /srv/backup/
        tar -czf "/srv/backup/${prefix}${backupDate}.tar.gz" config/ data/ themes/
        rm -rfd /srv/backup/config /srv/backup/data /srv/backup/themes
        sudo -u apache php81 /var/www/tp2_nextcloud/occ maintenance:mode --off
        sudo -u apache sed -i -e "s/'maintenance' => false/'maintenance' => true/" $configPath
else
        echo "Backup failed."
        # On rm au cas où certains dossiers auraient réussi à être copiés
        rm -rfd /srv/backup/config /srv/backup/data /srv/backup/themes
        sudo -u apache php81 /var/www/tp2_nextcloud/occ maintenance:mode --off
        sudo -u apache sed -i -e "s/'maintenance' => false/'maintenance' => true/" $configPath
        exit 1
fi
```

### Création du user

Cet user sera celui qui lancera le script via le futur service

```sh
[unepicier@web srv]$ sudo useradd backup -m -d /srv/backup -s /usr/bin/nologin
```

On lui donne la propriété du script et du dossier de backup

```sh
[unepicier@web srv]$ sudo chown backup:backup backup/
[unepicier@web srv]$ sudo chown backup:backup tp3_backup.sh
```

Cependant, dans le script on a besoin de faire une commande sous le user apache. Lorsque l'on souahite lancer le script avec notre user, il nous demande un password parce qu'il n'a pas le droit de base d'effectuer un sudo.

Pour régler ça, on fait

```sh
[unepicier@web srv]$ sudo usermod -aG wheel backup
[unepicier@web srv]$ sudo visudo
[unepicier@web srv]$ sudo grep %wheel /etc/sudoers
%wheel  ALL=(ALL)       ALL
%wheel  ALL=(ALL)       NOPASSWD: ALL

[unepicier@web srv]$ grep wheel /etc/group
wheel:x:10:unepicier,backup
```

Il nous reste encore un dernier problème, notre user n'a pas les permissions de lire le fichier config de nextcloud

```sh
[unepicier@web srv]$ sudo usermod -aG apache backup
```

Et maintenant ça marche !!

## II. Service et Timer

Dans cet partie, on va créer un service pour lancer le script et un timer qui lancera le service à interval régulier

### Service

On créer donc le service

```sh
[unepicier@web srv]$ sudo vim /etc/systemd/system/backup.service
[unepicier@web srv]$ sudo cat /etc/systemd/system/backup.service
[Unit]
Description=Backup nextcloud files

[Service]
ExecStart=/srv/tp3_backup.sh
WorkingDirectory=/srv/
User=backup
Type=oneshot

[Install]
WantedBy=multi-user.target
```

On le test

```sh
[unepicier@web srv]$ systemctl status backup
○ backup.service - Backup nextcloud files
     Loaded: loaded (/etc/systemd/system/backup.service; disabled; vendor preset: disabled)
     Active: inactive (dead)
[unepicier@web srv]$ sudo systemctl start backup
[unepicier@web srv]$ ls -l backup/
total 22996
-rw-r--r--. 1 backup backup 23547895 Nov 20 16:50 bkp_nextcloud_221120165023.tar.gz
```

Parfait

### Timer

On créer le timer

```sh
[unepicier@web srv]$ sudo vim /etc/systemd/system/backup.timer
[unepicier@web srv]$ sudo cat /etc/systemd/system/backup.timer
[Unit]
Description=Run service backup

[Timer]
OnCalendar=*-*-* 4:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

On le lance

```sh
[unepicier@web srv]$ sudo systemctl daemon-reload
[unepicier@web srv]$ sudo systemctl start backup.timer
[unepicier@web srv]$ sudo systemctl enable backup.timer
Created symlink /etc/systemd/system/timers.target.wants/backup.timer → /etc/systemd/system/backup.timer.

[unepicier@web srv]$ systemctl status backup
○ backup.service - Backup nextcloud files
     Loaded: loaded (/etc/systemd/system/backup.service; disabled; vendor preset: disabled)
     Active: inactive (dead)
TriggeredBy: ● backup.timer

Nov 20 16:47:26 web.tp2.linux systemd[1]: Finished Backup nextcloud files.
Nov 20 16:47:26 web.tp2.linux systemd[1]: backup.service: Consumed 1.459s CPU time.
Nov 20 16:50:23 web.tp2.linux systemd[1]: Starting Backup nextcloud files...
Nov 20 16:50:23 web.tp2.linux sudo[2229]:   backup : PWD=/srv ; USER=apache ; COMMAND=/bin/php81 /var/>
Nov 20 16:50:23 web.tp2.linux sudo[2248]:   backup : PWD=/srv ; USER=apache ; COMMAND=/bin/sed -i -e s>
Nov 20 16:50:25 web.tp2.linux sudo[2263]:   backup : PWD=/srv/backup ; USER=apache ; COMMAND=/bin/php8>
Nov 20 16:50:26 web.tp2.linux sudo[2272]:   backup : PWD=/srv/backup ; USER=apache ; COMMAND=/bin/sed >
Nov 20 16:50:26 web.tp2.linux systemd[1]: backup.service: Deactivated successfully.
Nov 20 16:50:26 web.tp2.linux systemd[1]: Finished Backup nextcloud files.
Nov 20 16:50:26 web.tp2.linux systemd[1]: backup.service: Consumed 1.390s CPU time.

[unepicier@web srv]$ sudo systemctl list-timers
NEXT                        LEFT       LAST                        PASSED    UNIT                     >
Sun 2022-11-20 17:49:45 CET 54min left Sun 2022-11-20 16:40:50 CET 14min ago dnf-makecache.timer      >
Mon 2022-11-21 00:00:00 CET 7h left    Sun 2022-11-20 16:23:27 CET 31min ago logrotate.timer          >
Mon 2022-11-21 04:00:00 CET 11h left   n/a                         n/a       backup.timer             >
Mon 2022-11-21 16:38:27 CET 23h left   Sun 2022-11-20 16:38:27 CET 16min ago systemd-tmpfiles-clean.ti>
4 timers listed.
Pass --all to see loaded but inactive timers, too.
```

Parfait!

## II. NFS

Maintenant, on va mettre en place un serveur NFS (partage de fichiers) sur une nouvelle machine:

- `storage.tp3.linux` à l'IP `10.102.1.15`

### Mise en place

On créer le dossier qui sera partagé

```sh
[unepicier@storage ~]$ sudo mkdir -p /srv/nfs_shares/web.tp2.linux
```

### Install serveur NFS

Maintenant, on installe, conf, et lance le serveur nfs

```sh
[unepicier@storage ~]$ sudo dnf install nfs-utils

[unepicier@storage ~]$ sudo mkdir web.tp2.linux
[unepicier@storage ~]$ sudo useradd backup -m -d /srv/nfs_shares/web.tp2.linux -s /usr/bin/login
[unepicier@storage ~]$  sudo chown backup:backup /srv/nfs_shares/web.tp2.linux

[unepicier@storage ~]$ sudo vim /etc/exports
[unepicier@storage ~]$ sudo cat /etc/exports
/srv/nfs_shares/web.tp2.linux 10.102.1.11(rw,sync,no_subtree_check)

[unepicier@storage ~]$ sudo systemctl enable nfs-server
Created symlink /etc/systemd/system/multi-user.target.wants/nfs-server.service → /usr/lib/systemd/system/nfs-server.service.
[unepicier@storage ~]$ sudo systemctl start nfs-server
[unepicier@storage ~]$ systemctl status nfs-server
● nfs-server.service - NFS server and services
     Loaded: loaded (/usr/lib/systemd/system/nfs-server.service; enabled; vendor preset: disabled)
    Drop-In: /run/systemd/generator/nfs-server.service.d
             └─order-with-mounts.conf
     Active: active (exited) since Sun 2022-11-20 17:17:27 CET; 27s ago
```

Maintenant on ouvre les ports nécessaire.
Cependant, nfs utilise les port 111 et 2049, mais il faut aussi ouvrir les ports de mountd rpc-bind, mais ces ports sont apparement dynamiques. Désolé Léo mais je vais suivre le lien et ouvrir les ports via des services

```sh
[unepicier@storage ~]$ sudo firewall-cmd --add-service=nfs --permanent
success
[unepicier@storage ~]$ sudo firewall-cmd --add-service=mountd --permanent
success
[unepicier@storage ~]$ sudo firewall-cmd --add-service=rpc-bind --permanent
success
[unepicier@storage ~]$ sudo firewall-cmd --reload
success
[unepicier@storage ~]$ sudo firewall-cmd --list-services
cockpit dhcpv6-client mountd nfs rpc-bind ssh
```

### Install client NFS

Tout d'abord on installe le serveur nfs

```sh
[unepicier@web ~]$ sudo dnf install nfs-utils -y
Complete!
```

Ensuite on monte le dossier distant sur notre machine web

```sh
[unepicier@web ~]$ sudo mount 10.102.1.15:/srv/nfs_shares/web.tp2.linux /srv/backup/
Created symlink /run/systemd/system/remote-fs.target.wants/rpc-statd.service → /usr/lib/systemd/system/rpc-statd.service.
```

On vérifie

```sh
[unepicier@web ~]$ df -h
Filesystem                                 Size  Used Avail Use% Mounted on
...
10.102.1.15:/srv/nfs_shares/web.tp2.linux  6.2G  1.1G  5.2G  18% /srv/backup
```

Maintenant on test

```sh
[unepicier@web ~]$ sudo touch /srv/backup/test.txt
```

Et enfin on regarde sur notre machine host

```sh
[unepicier@storage nfs_shares]$ ls -l web.tp2.linux/
total 0
-rw-r--r--. 1 backup backup 0 Nov 20 17:41 test.txt
```

Parfait, mais maintenant, on veut que le dossier sur le client se mount automatiquement au lancement de la machine

```sh
[unepicier@web ~]$ sudo vim /etc/fstab
[unepicier@web ~]$ sudo cat /etc/fstab
...
10.102.1.15:/srv/nfs_shares/web.tp2.linux /srv/backup nfs auto,nofail,noatime,nolock,intr,tcp,actimeo=1800 0 0
```

Et on test

```sh
[unepicier@web ~]$ sudo reboot
[unepicier@web ~]$ sudo rm /srv/backup/test.txt

--------------------------------------------------

[unepicier@storage nfs_shares]$ ls web.tp2.linux/
[unepicier@storage nfs_shares]$
```

Il n'y a bel et bien plus le fichier sur le serveur, on a donc bien réussi !!

## Amélioration

Faire une backup de nextcloud c'est bien, mais sans sa db c'est moins cool.
Dans le module 3, on a justement fait le service de sauvegarde de la db, on a plus qu'à la stocker sur notre serveur tout frais

**_(Cette partie est exactement la même que la [précédente](#install-client-nfs))_**

### Host

On créer sur l'host le dossier

```sh
[unepicier@storage nfs_shares]$ sudo mkdir db.tp2.linux
[unepicier@storage nfs_shares]$ sudo useradd db_dumps -m -d /srv/nfs_shares/db.tp2.linux -s /usr/bin/nologin
[unepicier@storage nfs_shares]$ sudo chmod db_dumps:db_dumps db.tp2.linux
```

On le rajoute au fichier de conf

```sh
[unepicier@storage nfs_shares]$ sudo vim /etc/exports
[unepicier@storage nfs_shares]$ sudo cat /etc/exports
/srv/nfs_shares/web.tp2.linux 10.102.1.11(rw,sync,no_subtree_check)
/srv/nfs_shares/db.tp2.linux 10.102.1.12(rw,sync,no_subtree_check)

[unepicier@storage nfs_shares]$ sudo systemctl restart nfs-server
```

### Client

Le problème c'est qu'ici, notre user à l'ID 1002 mais sur notre client, il a l'ID 1001, et ça, c'est pas bon, on va donc sur notre client changer l'id de l'user

```sh
[unepicier@db srv]$ sudo userdel db_dumps
[unepicier@db srv]$ sudo useradd db_dumps -u 1002 -m -s /srv/db_dumps/ -s /usr/bin/nologin

[unepicier@db srv]$ sudo chown db_dumps:db_dumps db_pass
[unepicier@db srv]$ sudo chown db_dumps:db_dumps tp3_db_dump.sh
```

On installe

```sh
[unepicier@db ~]$ sudo dnf install nfs-utils -y
Complete!
[unepicier@storage nfs_shares]$ sudo chown nobody db.tp2.linux/
[unepicier@storage nfs_shares]$ ls -l
total 0
drwxr-xr-x. 2 nobody root 6 Nov 20 18:04 db.tp2.linux
```

On monte le dossier

```sh
[unepicier@db ~]$ sudo mount 10.102.1.15:/
srv/nfs_shares/db.tp2.linux /srv/db_dumps/
Created symlink /run/systemd/system/remote-fs.target.wants/rpc-statd.service → /usr/lib/systemd/system/rpc-statd.service.
```

On test rapidement

```sh
[unepicier@db ~]$ sudo touch /srv/db_dumps/test.txt
[unepicier@db ~]$ ls /srv/db_dumps/
test.txt

--------------------------------------------------

[unepicier@storage nfs_shares]$ ls db.tp2.linux/
test.txt
```

Parfait maintenant on le mount au démarage

```sh
[unepicier@db ~]$ sudo vim /etc/fstab
[unepicier@db ~]$ sudo cat /etc/fstab
...
10.102.1.15:/srv/nfs_shares/db.tp2.linux /srv/db_dumps nfs auto,nofail,noatime,nolock,intr,tcp,actimeo=1800 0 0
```

On test

```sh
[unepicier@db ~]$ sudo reboot
[unepicier@db ~]$ sudo touch /srv/db_dumps/test
[unepicier@db ~]$ ls /srv/db_dumps/
test

--------------------------------------------------

[unepicier@storage nfs_shares]$ ls db.tp2.linux/
test
```

Nickel!
