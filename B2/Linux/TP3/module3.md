# Module 3: Sauvegarde de base de données

## I. Script dump

### Création user

```sql
MariaDB [(none)]> CREATE USER 'dump'@'localhost' IDENTIFIED BY 'dump';
Query OK, 0 rows affected (0.003 sec)

MariaDB [(none)]> GRANT ALL PRIVILEGES ON nextcloud.* TO 'dump'@'localhost';
Query OK, 0 rows affected (0.010 sec)

MariaDB [(none)]> FLUSH PRIVILEGES;
Query OK, 0 rows affected (0.001 sec)
```

### Script

```sh
[unepicier@db ~]$ cd /srv
[unepicier@db srv]$ sudo mkdir db_dumps
[unepicier@db srv]$ sudo vim tp3_db_dump.sh
[unepicier@db srv]$ sudo cat tp3_db_dump.sh
#!/bin/bash
dumpDate=$(date +"%y%m%d%H%M%S")
mysqldump --user=dump --password=dump --skip-lock-tables --databases nextcloud | gzip -c > /srv/db_dumps/db_nextcloud_${dumpDate}.sql.gz"
```

## II. Clean it

Dans un premier temps,
on va rajouter un petit en-tête juste après le shebang

```sh
# Author: Vasseur Alexis
# Date: 18/11/2022 15:34
# Description: Make a dump file from a SQL server
```

On va également (pour l'instant) déclarer des variables juste après

```sh
# MariaDB Conf
server='localhost'
user='dump'
password='dump'
db='nextcloud'

# Dump conf
saveDir='/srv/db_dumps/' # Keep the "/" at the end
prefix='db_'
useDate=true

dumpDate=$(date +"%y%m%d%H%M%S")
```

Ensuite on rajoute quelques gestions d'erreurs

```sh
###################
# Errors handling #
###################

# 'server' use a default value if any specified
if [ -z "${server}" ]
then
        1>&2 printf "Any db host specified.\nUsing 'localhost' instead.\n"
        server='localhost'
fi

[ -z "${user}" ] && { 1>&2 printf "Any db user specified.\nAborting.\n"; exit 1; }
[ -z "${db}" ] && { 1>&2 printf "Any database specified.\nAborting.\n"; exit 1; }

# 'saveDir' use a default value if any specified
if [ -z "${saveDir}" ]
then
        1>&2 printf "Any saving directory specified.\nUsing a default value."
        saveDir='/srv/db_dumps/'
fi
# Check if 'saveDir' has a slash at the end, otherwise we add one
[[ "$saveDir" != */ ]] && saveDir="${saveDir}/"
#Check if 'saveDir' exists, otherwise create it
if [ ! -d "${saveDir}" ]
then
        1>&2 printf "Save directory doesn't exists.\nCreating it...\n"
        mkdir -p ${saveDir}
fi
```

Avec l'introduction des variables `useDate` et `port`, on doit maintenant changer la commande mysqldump + une petite gestion d'erreur, histoire qu'il ne fasse pas un `gz` vide

```sh
# Everything's good let's dump!
outputPath="${saveDir}${prefix}${db}$( [ ${useDate} == true ] && echo "_${dumpDate}" ).sql"

mysqldump -h ${server} $( [ ! -z "${port}" ] && echo "-P ${port}" ) --user=${user} --password=${password} --skip-lock-tables --databases ${db} > $outputPath
if [[ $? == 0 ]]
then
        gzip -c $outputPath > "${outputPath}.gz"
        rm -f $outputPath
        printf "Created dump file in \"${saveDir}\"\nFile name: ${prefix}${db}$( [ ${useDate} == true ] && echo "_${dumpDate}" ).sql.gz\n"
else
        rm -f $outputPath
fi
```

Enfin, ajoutons un petit message de fin

```sh
printf "Created dump file in \"${saveDir}\"\nFile name: ${prefix}${db}$( [ ${useDate} ] && echo "_${dumpDate}" ).sql.gz\n"
```

# User

Maintenant on doit créer un user qui sera celui qui lancera le script

```sh
[unepicier@db srv]$ sudo useradd db_dumps -m -d /srv/db_dumps -s /usr/bin/nologin

# On change le propriétaire du dossier /srv/db_dumps au nouvel user
[unepicier@db srv]$ sudo chown db_dumps:db_dumps ./db_dumps/
[unepicier@db srv]$ sudo chown db_dumps:db_dumps ./tp3_db_dump.sh
[unepicier@db srv]$ ls -l
total 4
drwxr-xr--. 2 db_dumps db_dumps    6 Nov 18 17:10 db_dumps
-rwxr-xr--. 1 db_dumps db_dumps 1604 Nov 18 17:19 tp3_db_dump.sh
```

On test

```sh
[unepicier@db srv]$ sudo -u db_dumps /srv/tp3_db_dump.sh
Created dump file in "/srv/db_dumps/"
File name: db_nextcloud_221118173223.sql.gz

[unepicier@db srv]$ ls db_dumps
db_nextcloud_221118173223.sql.gz
```

**Ajout d'une gestion d'options**

On ajoute une partie de gestion d'options juste après la déclaration des variables

```sh
######################
# ARGUMENTS HANDLING #
######################
#
# s => server
# P => port
# u => user
# p => password
# d => db
# f => prefix
# D => useDate

while getopts ":s:P:u:p:d:f:D:" option
do
    case $option in
        s)
                server=$OPTARG
                ;;
        P)
                port=$OPTARG
                ;;
        u)
                user=$OPTARG
                ;;
        p)
                password=$OPTARG
                ;;
        d)
                db=$OPTARG
                ;;
        f)
                prefix=$OPTARG
                ;;
        D)
                useDate=$OPTARG
                ;;
        :)
                1>&2 echo "Missing argument for option $OPTARG"
                exit 1
                ;;
        \?)
                1>&2 echo "Invalid option: $OPTARG"
                exit 1
                ;;
    esac
done
```

On test:

```sh
[unepicier@db srv]$ sudo -u db_dumps /srv/tp3_db_dump.sh -u
Missing argument for option u
[unepicier@db srv]$ sudo -u db_dumps /srv/tp3_db_dump.sh -u ""
Any db user specified.
Aborting.
```

Parfait !

**Stocker le password**

On souhaite maintenant stocker le password

```sh
# On créer le ficher
[unepicier@db srv]$ touch db_pass
[unepicier@db srv]$ sudo chown db_dumps:db_dumps db_pass
[unepicier@db srv]$ ls -l | grep db_pass
total 4
-rw-r--r--. 1 db_dumps db_dumps    0 Nov 18 18:00 db_pass
```

Et maintenant on récupère la variable

```sh
# MariaDB Conf
server='localhost'
port=3306
user='dump'
password=''
source ./db_pass # Get password from file
[ -z $password ] && password='dump' # If empty then set a default one
db='nextcloud'
```

Juste après la gestion d'options, on peut le sauevgarder dans le fichier

```sh
# Save password in file
echo "password=$password" > ./db_pass
```

On test

```sh
[unepicier@db srv]$ cat db_pass
[unepicier@db srv]$ # On a donc rien dans le fichier
[unepicier@db srv]$ sudo -u db_dumps /srv/tp3_db_dump.sh
Created dump file in "/srv/db_dumps/"
File name: db_nextcloud_221118181009.sql.gz

[unepicier@db srv]$ cat ./db_pass
password=dump
```

Maintenant on va voir si quand je change le pswd dans le ficher, le script l'utilise et bien évidement n'arrive pas à se connecter

```sh
[unepicier@db srv]$ sudo vim ./db_pass
[unepicier@db srv]$ cat ./db_pass
password='1234'
[unepicier@db srv]$ sudo -u db_dumps /srv/tp3_db_dump.sh
mysqldump: Got error: 1045: "Access denied for user 'dump'@'localhost' (using password: YES)" when trying to connect
```

## Service et timer

### Service

On créer tout d'abord le service

```sh
[unepicier@db srv]$ sudo vim /etc/systemd/system/db-dump.service
[unepicier@db srv]$ cat /etc/systemd/system/db-dump.service
[Unit]
Description=Dump mariadb specific database

[Service]
ExecStart=/srv/tp3_db_dump.sh
WorkingDirectory=/srv/
User=db_dumps
Type=oneshot

[Install]
WantedBy=multi-user.target
```

On essaie de le lancer

```sh
[unepicier@db srv]$ systemctl status db-dump
○ db-dump.service - Dump mariadb specific database
     Loaded: loaded (/etc/systemd/system/db-dump.service; disabled; vendor preset: disabled)
     Active: inactive (dead)

[unepicier@db srv]$ sudo systemctl start db-dump

[unepicier@db srv]$ systemctl status db-dump
○ db-dump.service - Dump mariadb specific database
     Loaded: loaded (/etc/systemd/system/db-dump.service; disabled; vendor preset: disabled)
     Active: inactive (dead)

Nov 18 19:24:21 db.tp2.linux systemd[1]: Starting Dump mariadb specific database...
Nov 18 19:24:21 db.tp2.linux tp3_db_dump.sh[4753]: Created dump file in "/srv/db_dumps/"
Nov 18 19:24:21 db.tp2.linux tp3_db_dump.sh[4753]: File name: db_nextcloud_221118192421.sql.gz
Nov 18 19:24:21 db.tp2.linux systemd[1]: db-dump.service: Deactivated successfully.
Nov 18 19:24:21 db.tp2.linux systemd[1]: Finished Dump mariadb specific database.
```

On vérifie le fichier créé

```sh
[unepicier@db srv]$ ls -l db_dumps/
total 28
-rw-r--r--. 1 db_dumps db_dumps 25640 Nov 18 19:24 db_nextcloud_221118192421.sql.gz
[unepicier@db srv]$ sudo gzip -d db_dumps/db_nextcloud_221118192421.sql.gz
[unepicier@db srv]$ cat db_dumps/db_nextcloud_221118192421.sql
-- MariaDB dump 10.19  Distrib 10.5.16-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: nextcloud
-- ------------------------------------------------------
-- Server version       10.5.16-MariaDB-log

...

-- Dump completed on 2022-11-18 19:24:21
```

### Timer

On créer le timer

```sh
[unepicier@db srv]$ sudo vim /etc/systemd/system/db-dump.timer
[unepicier@db srv]$ cat  /etc/systemd/system/db-dump.timer
[Unit]
Description=Timer for db-dump service

[Timer]
OnCalendar=*-*-* 4:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Après avoir lu la doc, j'ai pensé que c'est utile de mettre le persistent au cas où
Maintenant on test:

```sh
[unepicier@db srv]$ sudo systemctl daemon-reload
[unepicier@db srv]$ sudo systemctl start db-dump.timer
[unepicier@db srv]$ sudo systemctl enable db-dump.timer
Created symlink /etc/systemd/system/timers.target.wants/db-dump.timer → /etc/systemd/system/db-dump.timer.

[unepicier@db srv]$ systemctl status db-dump.timer
● db-dump.timer - Timer for db-dump service
     Loaded: loaded (/etc/systemd/system/db-dump.timer; enabled; vendor preset: disabled)
     Active: active (waiting) since Fri 2022-11-18 19:32:35 CET; 23s ago
      Until: Fri 2022-11-18 19:32:35 CET; 23s ago
    Trigger: Sat 2022-11-19 04:00:00 CET; 8h left
   Triggers: ● db-dump.service

Nov 18 19:32:35 db.tp2.linux systemd[1]: Started Timer for db-dump service.

[unepicier@db srv]$ sudo systemctl list-timers
NEXT                        LEFT          LAST                        PASSED       UNIT                         ACTIVATES >
Fri 2022-11-18 20:37:44 CET 1h 4min left  Fri 2022-11-18 19:32:45 CET 26s ago      dnf-makecache.timer          dnf-makeca>
Sat 2022-11-19 00:00:00 CET 4h 26min left Fri 2022-11-18 00:00:18 CET 19h ago      logrotate.timer              logrotate.>
Sat 2022-11-19 04:00:00 CET 8h left       n/a                         n/a          db-dump.timer                db-dump.se>
Sat 2022-11-19 14:57:04 CET 19h left      Fri 2022-11-18 14:57:04 CET 4h 36min ago systemd-tmpfiles-clean.timer systemd-tm>
4 timers listed.
Pass --all to see loaded but inactive timers, too.
```

## Restore

Tout ça c'est beau mais comment ferait-on pour restorer en cas de problème la db ?

Il suffit de faire ça

```sh
# Tout d'abord on récupère le dernier dump
[unepicier@db ~]$ ls -lt /srv/db_dumps/ | head -2 # -t pour trier par date
total 204
-rw-r--r--. 1 db_dumps db_dumps  25640 Nov 18 22:22 db_nextcloud_221118222237.sql.gz

# On unzip le fichier sql
[unepicier@db ~]$ sudo gzip -d /srv/db_dumps/db_nextcloud_221118222237.sql.gz
```

Dans notre cas, la db est locale, mais l'on peut très bien faire la prochaine commande avec `-h <host ip>` et si besoin `-P <port>` pour le faire à distance.

```sh
[unepicier@db ~]$ mysql -u root -p nextcloud < /srv/db_dumps/db_nextcloud_221118222237.sql
```

Cette commande se connecte donc au serveur mariadb, on spécifie directement la db choisis et on exécute par le biais du fichier toutes les commandes **sql** présente à l'intérieur.

Cependant, c'est la solution _trop facile_ de se connecter en tant que root, on a toutes les permissions, partout, sur tout. Mais le problème c'est que par je ne sais quel moyen, imaginons que le fichier à pu être modifié par un agent externe pour par exemple avoir un accès root (comme une injection sql mais en mieux/compliqué).

Alors on peut tout simplement faire ça (puisque l'on peut déjà spécifier la db)

```sh
[unepicier@db ~]$ mysql -u dump -p nextcloud < /srv/db_dumps/db_nextcloud_221118222237.sql
```

C'est quand même mieux que d'être root, et en plus, comme le script (en tout cas ici) doit être en local, choisir le user `dump` au lieu de `nextcloud` malgré qu'ils ont les mêmes privilèges permets d'avoir la garantie que les commandes SQL seront faites en `localhost` puisque l'on a autorisé les connexion à cet user uniquement en localhost.
