# TP5
## MariaDB
### 1. Install
```sh
$ sudo dnf install mariadb

$ sudo systemctl start mariadb
$ sudo systemctl enable mariadb

$ systemctl status mariadb
● mariadb.service - MariaDB 10.3 database server
   Loaded: loaded (/usr/lib/systemd/system/mariadb.service; enabled; vendor preset: disabled)
   Active: active (running)

$ sudo ss -ltunp | grep mysqld
tcp   LISTEN 0      80                 *:3306            *:*    users:(("mysqld",pid=8634,fd=21))
# Port: 3306

$ sudo ps -ef | grep mysql
mysql       8634       1  0 19:33 ?        00:00:00 /usr/libexec/mysqld --basedir=/usr
# User: mysql

$ sudo firewall-cmd --add-port=3306/tcp --permanent
$ sudo firewall-cmd --reload
```
### 2. Conf
```sh
$ mysql_secure_installation

//////////
QUESTIONS
//////////

$ sudo mysql -u root -p

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
```sh
$ sudo dnf provides mysql
mysql-8.0.26-1.module+el8.4.0+652+6de068a7.x86_64 : MySQL client programs and shared libraries
Repo        : appstream
Matched from:
Provide    : mysql = 8.0.26-1.module+el8.4.0+652+6de068a7

$ sudo dnf install mysql-server

$ mysql -u nextcloud -p -h 10.5.1.12 -P 3306 -D nextcloud
mysql> 

mysql> SHOW TABLES;
Empty set (0.01 sec)
```

## Setup WEB
### 1. Install Apache
#### A. Apache
```sh
$ sudo dnf install httpd

$ sudo systemctl start httpd
$ sudo systemctl enable httpd

$ sudo ss -ltunp | grep httpd
tcp   LISTEN 0      128                *:80              *:*    users:(("httpd",pid=2301,fd=4),("httpd",pid=2300,fd=4),("httpd",pid=2299,fd=4),("httpd",pid=2297,fd=4))
# Port: 80

$ sudo ps -ef | grep httpd
root        2297       1  0 19:32 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
apache      2298    2297  0 19:32 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
apache      2299    2297  0 19:32 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
apache      2300    2297  0 19:32 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
apache      2301    2297  0 19:32 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
# User: apache

$ sudo firewall-cmd --add-port=80/tcp --permanent
$ sudo firewall-cmd --reload

# PC
$ curl -I 10.5.1.11
HTTP/1.1 403 Forbidden # Forbidden mais ça marche donc tranquille nan ?
Date: Sun, 28 Nov 2021 18:37:52 GMT
Server: Apache/2.4.37 (rocky)
Last-Modified: Fri, 11 Jun 2021 15:23:57 GMT
ETag: "1dc5-5c47f18a65d40"
Accept-Ranges: bytes
Content-Length: 7621
Content-Type: text/html; charset=UTF-8
```

#### B. PHP
```sh
$ sudo dnf install epel-release
$ sudo dnf update
$ sudo dnf install https://rpms.remirepo.net/enterprise/remi-release-8.rpm
$ sudo dnf module enable php:remi-7.4
$ sudo dnf install zip unzip libxml2 openssl php74-php php74-php-ctype php74-php-curl php74-php-gd php74-php-iconv php74-php-json php74-php-libxml php74-php-mbstring php74-php-openssl php74-php-posix php74-php-session php74-php-xml php74-php-zip php74-php-zlib php74-php-pdo php74-php-mysqlnd php74-php-intl php74-php-bcmath php74-php-gmp
```

### 2. Conf Apache
```sh
$ sudo cat /etc/httpd/conf/httpd.conf | tail -1
IncludeOptional conf.d/*.conf

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

$ sudo mkdir /var/www/nextcloud /var/www/nextcloud/html
$ sudo chown -R apache:apache /var/www/nextcloud/
$ sudo nano /etc/opt/remi/php74/php.ini
$ sudo cat /etc/opt/remi/php74/php.ini | grep date.timezone
date.timezone = "Europe/Paris"
```

### 3. Install NextCloud

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

# PC:
$ sudo nano /etc/hosts
$ sudo cat /etc/hosts | grep tp5
10.5.1.11 web.tp5.linux

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