# Module 1: Reverse Proxy

## II. Setup

On installe et lance nginx

```sh
[unepicier@proxy ~]$ sudo dnf install nginx -y
Complete!
[unepicier@proxy ~]$ sudo systemctl enable nginx
[unepicier@proxy ~]$ sudo systemctl start nginx
```

On cherche sur quel port écoute nginx

```sh
[unepicier@proxy ~]$ sudo ss -laputn | grep nginx
tcp   LISTEN 0      511             0.0.0.0:80        0.0.0.0:*     users:(("nginx",pid=1050,fd=6),("nginx",pid=1049,fd=6))
tcp   LISTEN 0      511                [::]:80           [::]:*     users:(("nginx",pid=1050,fd=7),("nginx",pid=1049,fd=7))
```

On ouvre le port dans le firewall

```sh
[unepicier@proxy ~]$ sudo firewall-cmd --add-port=80/tcp --permanent
success
[unepicier@proxy ~]$ sudo firewall-cmd --reload
success
[unepicier@proxy ~]$ sudo firewall-cmd --list-ports
22/tcp 80/tcp
```

On cherche avec quel utilisateur tourne nginx

```sh
[unepicier@proxy ~]$ ps -ef | grep nginx
root        1049       1  0 09:47 ?        00:00:00 nginx: master process /usr/sbin/nginx
nginx       1050    1049  0 09:47 ?        00:00:00 nginx: worker process
```

On vérifie qu'on a bien la page d'accueil nginx avec une requête HTTP

```sh
[unepicier@proxy ~]$ curl localhost
<!doctype html>
<html>
  <head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <title>HTTP Server Test Page powered by: Rocky Linux</title>
    ...
  </head>
  <body>
    ...
  </body>
</html>
```

Maintenant on va configurer nginx pour l'utiliser comme reverse proxy.

On créer un fichier de conf

```sh
[unepicier@proxy ~]$ sudo vim /etc/nginx/nginx.conf
[unepicier@proxy ~]$ cat /etc/nginx/nginx.conf
server {
    # On indique le nom que client va saisir pour accéder au service
    # Pas d'erreur ici, c'est bien le nom de web, et pas de proxy qu'on veut ici !
    server_name web.tp2.linux;

    # Port d'écoute de NGINX
    listen 80;

    location / {
        # On définit des headers HTTP pour que le proxying se passe bien
        proxy_set_header  Host $host;
        proxy_set_header  X-Real-IP $remote_addr;
        proxy_set_header  X-Forwarded-Proto http;
        proxy_set_header  X-Forwarded-Host $remote_addr;
        proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;

        # On définit la cible du proxying
        proxy_pass http://10.102.1.11:80;
    }

    # Deux sections location recommandés par la doc NextCloud
    location /.well-known/carddav {
      return 301 $scheme://$host/remote.php/dav;
    }

    location /.well-known/caldav {
      return 301 $scheme://$host/remote.php/dav;
    }
}
[unepicier@proxy ~]$ sudo systemctl restart nginx
```

Puis on informe Nextcloud qu'il a maintenant un reverse proxy

```sh
[unepicier@web ~]$ sudo vim /var/www/tp2_nextcloud/config/config.php
[unepicier@web ~]$ sudo cat /var/www/tp2_nextcloud/config/config.php
<?php
$CONFIG = array (
  'instanceid' => 'oc61nu8i8ul6',
  'passwordsalt' => 'ESWOD1k9wRu2ER7kKtp+GM4woZaVF+',
  'secret' => 'qALtC5frusIpTtqNpk+6EBnIdrgdHfoYLp8gfCtP0SSmUVfK',
  'trusted_domains' =>
  array (
    0 => '10.102.1.11',
    1 => 'web.tp2.linux'
  ),
  'datadirectory' => '/var/www/tp2_nextcloud/data',
  'dbtype' => 'mysql',
  'version' => '25.0.0.15',
  'overwrite.cli.url' => 'http://10.102.1.11',
  'dbname' => 'nextcloud',
  'dbhost' => 'db.tp2.linux:3306',
  'dbport' => '',
  'dbtableprefix' => 'oc_',
  'mysql.utf8mb4' => true,
  'dbuser' => 'nextcloud',
  'dbpassword' => 'nextcloud',
  'installed' => true,
);
```

Et maintenant on peut y accéder que par `web.tp2.linux` (domaine précisé dans mon fichier `hosts`) car dans la config de Nextcloud, on a précisé le champ `trusted_domains`.

## III. HTTPS

Les installs

```sh
[unepicier@proxy ~]$ sudo dnf install epel-release
[unepicier@proxy ~]$ sudo dnf install certbot python3-certbot-nginx

[unepicier@proxy ~]$ sudo firewall-cmd --remove-port=80/tcp --permanent
success
[unepicier@proxy ~]$ sudo firewall-cmd --add-service=https --permanent
success
[unepicier@proxy ~]$ sudo firewall-cmd --reload
success
```

Génération du certificat

```sh
[unepicier@proxy ~]$ openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 -keyout server.key -out server.crt
Common Name []: web.tp2.
[unepicier@proxy ~]$ mv server.crt web.tp2.linux.crt
[unepicier@proxy ~]$ mv server.key web.tp2.linux.key
[unepicier@proxy ~]$ sudo mv web.tp2.linux.crt /etc/pki/tls/certs
[unepicier@proxy ~]$ sudo mv web.tp2.linux.key /etc/pki/tls/private
```

Puis on modifie la conf de nginx:

```sh
[unepicier@proxy ~]$ sudo cat /etc/nginx/nginx.conf
...
server {
        # On indique le nom que client va saisir pour accéder au service
        # Pas d'erreur ici, c'est bien le nom de web, et pas de proxy qu'on veut ici !
        server_name web.tp2.linux;

        # Port d'écoute de NGINX
        listen 443 ssl;

        ssl_certificate /etc/pki/tls/certs/web.tp2.linux.crt;
        ssl_certificate_key /etc/pki/tls/private/web.tp2.linux.key;

        location / {
            # On définit des headers HTTP pour que le proxying se passe bien
            proxy_set_header  Host $host;
            proxy_set_header  X-Real-IP $remote_addr;
            proxy_set_header  X-Forwarded-Proto https;
            proxy_set_header  X-Forwarded-Host $remote_addr;
            proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;

            # On définit la cible du proxying
            proxy_pass http://10.102.1.11:80;
        }

        # Deux sections location recommandés par la doc NextCloud
        location /.well-known/carddav {
        return 301 $scheme://$host/remote.php/dav;
        }

        location /.well-known/caldav {
        return 301 $scheme://$host/remote.php/dav;
    }
    ...
[unepicier@proxy ~]$ sudo systemctl restart nginx
```

On informe Nextcloud qu'on travaille maintenant sur du https

```sh
[unepicier@web ~]$ sudo vim /var/www/tp2_nextcloud/config/config.php
[unepicier@web ~]$ sudo cat /var/www/tp2_nextcloud/config/config.php
...
  'overwrite.cli.url' => 'https://web.tp2.linux',
  'overwriteprotocol' => 'https',
...
[unepicier@web ~]$ sudo systemctl restart httpd
```

Et ça fonctionne parfaitement !!
