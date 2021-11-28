# TP5
Dans ce TP, on va ce concocter un serveur cloud perso.

## Sommaire
- [MariaDB](#mariadb)
    - [1. Install](#1-install)
    - [2. Conf](#2-conf)
    - [3. Test](#3-test)
- [Setup WEB](#setup-web)
    - [1. Install Apache](#1-install-apache)
        - [A. Apache](#a-apache)
        - [B. PHP](#b-php)
    - [2. Conf Apache](#2-conf-apache)
    - [Install NextCloud](#install-nextcloud)


## MariaDB
### 1. Install
Premièrement, on installe le service de DB: `MariaDB`.
```sh
$ sudo dnf install mariadb
```
Puis on le lance et l'active au démarrage de la machine.
```sh
$ sudo systemctl start mariadb
$ sudo systemctl enable mariadb
```
On vérfie qu'il soit bien lancé, on regarder quel port est utilisé par MariaDB ainsi que quel utilisateur lance le processus.
```sh
$ systemctl status mariadb
● mariadb.service - MariaDB 10.3 database server
   Loaded: loaded (/usr/lib/systemd/system/mariadb.service; enabled; vendor preset: disabled)
   Active: active (running)

$ sudo ss -ltunp | grep mysqld
tcp   LISTEN 0      80                 *:3306            *:*    users:(("mysqld",pid=8634,fd=21))

$ sudo ps -ef | grep mysql
mysql       8634       1  0 19:33 ?        00:00:00 /usr/libexec/mysqld --basedir=/usr
```
Le port utilisé est donc 3306 et l'utilisateur qui lance le processus est `mysql`.<br>
On active donc le port 3306 dans le firewall, histoire de pouvoir s'y connecter.
```sh
$ sudo firewall-cmd --add-port=3306/tcp --permanent
$ sudo firewall-cmd --reload
```
### 2. Conf
Maintenant on va passer à la config.
En exécutant la commande suivante, plusieurs questions fermées vont nous être posés, nous les expliquont donc.
```sh
$ mysql_secure_installation
```

* `Set root password? [Y/n] Y`<br>
Faut-il définir un mot de passe à l'utilisateur `root` ?<br>
Oui car l'utilisateur `root` a tout les privilèges et peut donc absolument tout faire. Il est donc nécessaire de protéger cet utilisateur par un mot de passe (pas root et de préférence lourd).

* `Remove anonymous users? [Y/n] Y`<br>
Faut-il supprimer l'utilisateur `anonymous` ?<br>
Oui car l'utilsateur `anonymous` est créer pour que n'importe qui puisse se connecter au serveur sans aucun réel compte. Normalement, il est créer par défaut pour faire des tests mais il est impératif de le supprimer pour ne pas laisser une porte géante et grande ouverte à tout le monde.

* `Disallow root login remotely? [Y/n] Y`<br>
Faut-il supprimer la connexion à distance à l'utilisateur `root` ?<br>
Oui car quiconque aurait pu donc trouver le mot de passe de cet utilisateur, on doit empêcher toute connexion distante à ce "super" compte. On peut donc s'y connecter mais uniquement en local.

* `Remove test database and access to it? [Y/n] Y`<br>
Faut-il supprimer la base de données `test` ainsi que ses accès ?<br>
Oui puisque comme l'utilisateur `anonymous`, cette bdd est uniquement là pour faire des tests. On doit donc la supprimer.

* `Reload privilege tables now? [Y/n] Y`<br>
Doit-on recharger les privilèges des tables maintenant ?<br>
Égaelement oui afin d'appliquer toutes les modifications effectués juste précedemment.
<br><br>

OK, ensuite on essaie donc de se connecter avec l'utilisateur `root` (puisqu'il n'y a que lui pour l'instant).

```sh
$ sudo mysql -u root -p
MariaDB[(none)]> 
```
Parfait ! Maintenant, on créer un nouvel utilisateur `nextcloud` qui pourra se connecter depuis l'adresse IP `10.5.1.11` avec le mot de passe `meow`.
<br>
Ensuite on créer une base de donnée `nextcloud` qu'utilisera NextCloud.
<br>
On adresse tout privlièges à l'utilisateur précedemment créer sur cette table.
<br>
Et enfin, on applique tout les modifications qui viennent d'être faites.
```sh
MariaDB[(none)]> CREATE USER 'nextcloud'@'10.5.1.11' IDENTIFIED BY 'meow';
Query OK, 0 rows affected (0.001 sec)

MariaDB[(none)]> CREATE DATABASE IF NOT EXISTS nextcloud CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
Query OK, 1 rows affected (0.001 sec)

MariaDB[(none)]> GRANT ALL PRIVILEGES ON nextcloud.* TO 'nextcloud'@'10.5.1.11';
Query OK, 0 rows affected (0.001 sec)

MariaDB[(none)]> FLUSH PRIVILEGES;
Query OK, 0 rows affected (0.001 sec)
```

### 3. Test

C'est tout beau tout rose, mais maintenant on va la tester et voir si tout est bon.
<br>
Donc sur l'autre machine (`web.tp5.linux`) on install donc également mysql, en cherchant tout d'abord dans quel package la commande `mysql` se trouve et on installe par la suite le package donné.

```sh
$ sudo dnf provides mysql
mysql-8.0.26-1.module+el8.4.0+652+6de068a7.x86_64 : MySQL client programs and shared libraries
Repo        : appstream
Matched from:
Provide    : mysql = 8.0.26-1.module+el8.4.0+652+6de068a7

$ sudo dnf install mysql-server
```
Maintenant on tente de se connecter au serveur MariaDB:
- Avec l'utilisateur `nextcloud`
- Le mot de passe (pas en clair, il sera demandé après)
- L'adresse IP du serveur MariaDB
- Le port à utiliser
- Et la base de donnée souhaitée

Et ensuite on exécute juste `SHOW TABLES;` pour voir si on à bel et bien le droit de lecture avec l'utilisateur actuel.
```sh
$ mysql -u nextcloud -p -h 10.5.1.12 -P 3306 -D nextcloud
mysql> 

mysql> SHOW TABLES;
Empty set (0.01 sec)
```
Nickel, le serveur MariaDB fonctionne !

## Setup WEB
Passons donc au serveur WEB/Apache.
### 1. Install Apache
#### A. Apache
On installe donc le package d'Apache sous le nom `httpd`.<br>
De même que pour MariaDB, on le lance et et l'active au démarrage de la machine.
```sh
$ sudo dnf install httpd

$ sudo systemctl start httpd
$ sudo systemctl enable httpd
```
On regarde ensuite quel port il écoute ainsi que l'utilisateur qui lance le processus.
```sh
$ sudo ss -ltunp | grep httpd
tcp   LISTEN 0      128                *:80              *:*    users:(("httpd",pid=2301,fd=4),("httpd",pid=2300,fd=4),("httpd",pid=2299,fd=4),("httpd",pid=2297,fd=4))

$ sudo ps -ef | grep httpd
root        2297       1  0 19:32 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
apache      2298    2297  0 19:32 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
apache      2299    2297  0 19:32 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
apache      2300    2297  0 19:32 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
apache      2301    2297  0 19:32 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
```
On a doit le port 80 et l'utilisateur `apache`.<br>
On ouvre donc le port 80 dans le firewall et on reload histoire d'appliquer les modifications.
```sh
$ sudo firewall-cmd --add-port=80/tcp --permanent
$ sudo firewall-cmd --reload
```
Là on va se faire un petit test et voir si depuis notre PC réel, la connexion fonctionne. Pour cela, on fait juste un `curl` de l'adresse IP de la machine hébergeant le serveur Apache.
```sh
$ curl -I 10.5.1.11
HTTP/1.1 403 Forbidden # "Forbidden" mais ça donne bien la page donc tranquille nan ? ^^
Date: Sun, 28 Nov 2021 18:37:52 GMT
Server: Apache/2.4.37 (rocky)
Last-Modified: Fri, 11 Jun 2021 15:23:57 GMT
ETag: "1dc5-5c47f18a65d40"
Accept-Ranges: bytes
Content-Length: 7621
Content-Type: text/html; charset=UTF-8
```

#### B. PHP
Ensuite on installe également PHP pour pouvoir gérer tout le coté serverside du Site WEB, ainsi qu'une demi-douzaine de paquage en lien avec php.
```sh
$ sudo dnf install epel-release
$ sudo dnf update
$ sudo dnf install https://rpms.remirepo.net/enterprise/remi-release-8.rpm
$ sudo dnf module enable php:remi-7.4
$ sudo dnf install zip unzip libxml2 openssl php74-php php74-php-ctype php74-php-curl php74-php-gd php74-php-iconv php74-php-json php74-php-libxml php74-php-mbstring php74-php-openssl php74-php-posix php74-php-session php74-php-xml php74-php-zip php74-php-zlib php74-php-pdo php74-php-mysqlnd php74-php-intl php74-php-bcmath php74-php-gmp
```

### 2. Conf Apache
Très bien, on passe à la configuration d'Apache.<br>
On commence par afficher la ligne dans la config principale qui inclus toutes les autres config enfants.
```sh
$ sudo cat /etc/httpd/conf/httpd.conf | tail -1
IncludeOptional conf.d/*.conf
```
Maintenant on créer un VirtualHost dans un nouveau fichier pour notre petit cloud <3
```sh
$ sudo nano /etc/httpd/conf.d/nextcloud.conf
$ sudo cat /etc/httpd/conf.d/nextcloud.conf
<VirtualHost *:80>
        DocumentRoot /var/www/nextcloud/html/
        ServerName web.tp5.linux
        <Directory /var/www/nextcloud/html/>
                Require all granted
                AllowOverride All
                Options FollowSymLinks MultiViews
                <IfModule mod_dav.c>
                        Dav off
                </IfModule>
        </Directory>
</VirtualHost>
```
En next, on créer donc le dossier qui sera considéré comme la racine de notre site.<br>
Pour qu'Apache y ai accès correctement, on attribut ces deux nouveaux dossiers à l'utilisateur `apache` ainsi qu'au groupe `apache`.<br>
En enfin, on précise dans la conf de PHP quelle est notre Timezone.
```
$ sudo mkdir /var/www/nextcloud /var/www/nextcloud/html
$ sudo chown -R apache:apache /var/www/nextcloud/
$ sudo nano /etc/opt/remi/php74/php.ini
$ sudo cat /etc/opt/remi/php74/php.ini | grep date.timezone
date.timezone = "Europe/Paris"
```

### 3. Install NextCloud
On touche au but !
Maintenant que tout est prêt, on doit maintenant installer le fameux NextCloud.<br>
Pour cela, on télécharge le zip contenant tout ce qu'est NextCloud, on l'unzip, ce qui créer un dossier avec tout dedans (on peut donc dégager le zip).<br>
On balance tout le contenu de ce dossier dans la racine de notre site (on supprime aussi ce dossier créé à l'unzip).<br>
Et pareil qu'il y a quelques instants, on attribut tout ces fichiers & dossiers à l'utilisateur `apache` et au groupe `apache`.<br>
Par précaution, on redémarre Apache.
```sh
$ curl -SLO https://download.nextcloud.com/server/releases/nextcloud-21.0.1.zip
$ ls
nextcloud-21.0.1.zip

$ unzip nextcloud-21.0.1.zip
$ rm nextcloud-21.0.1.zip
$ mv nextcloud/* /var/www/nextcloud/html/
$ rm nextcloud
$ sudo chown -R apache:apache /var/www/nextcloud/html/
# Au cas où:
$ sudo systemctl restart httpd
```
Sur notre PC réél, on va lui dire que quand on demande `web.tp5.linux`, lui doit comprendre l'adresse IP du sevreur Apache. On peut le faire dans le fichier `hosts`.
```sh
$ sudo nano /etc/hosts
$ sudo cat /etc/hosts | grep tp5
10.5.1.11 web.tp5.linux
```
KABOOM ! On teste donc dans notre chère navigateur le résultat, et on le montre dans ce compte rendu par un petit `curl`.
```sh
$ curl -I web.tp5.linux
HTTP/1.1 200 OK
Date: Sun, 28 Nov 2021 20:51:49 GMT
Server: Apache/2.4.37 (rocky)
Last-Modified: Thu, 08 Apr 2021 13:31:16 GMT
ETag: "9c-5bf760fd1b100"
Accept-Ranges: bytes
Content-Length: 156
Content-Type: text/html; charset=UTF-8
```
Tout fonctionne !