# TP4 : Conteneurs

## I. Docker

### 1. Install

On install docker

```sh
[unepicier@docker1 ~]$ sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
[unepicier@docker1 ~]$ sudo dnf update
[unepicier@docker1 ~]$ sudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
...
Complete!
```

On démarre docker

```sh
[unepicier@docker1 ~]$ sudo systemctl start docker
[unepicier@docker1 ~]$ sudo systemctl enable docker
Created symlink /etc/systemd/system/multi-user.target.wants/docker.service → /usr/lib/systemd/system/docker.service.
```

On ajoute notre user au groupe de docker

```sh
[unepicier@docker1 ~]$ sudo usermod -aG docker $(whoami)
[unepicier@docker1 ~]$ logout
```

### 3. Lancement de conteneurs

On lance le conteneur avec partage de dossier, et aussi l'ouverture du port

Dans un premier temps, on doit créer le fichier de conf, et aussi un petit fichier html

```sh
# /var/nginx/html => dossier centenant les fichiers html, css, etc...
[unepicier@docker1 ~]$ sudo mkdir -p /var/nginx/html

[unepicier@docker1 ~]$ sudo vim /var/nginx/html/index.html
[unepicier@docker1 ~]$ cat /var/nginx/html/index.html
<!DOCTYPE html>
<html>
        <head>
                <title>Nginx - Home</title>
                <meta charset="utf8" />
                <link rel="stylesheet" href="./index.css">
        </head>
        <body>
                ...
        </body>
</html>

[unepicier@docker1 ~]$ sudo vim /var/nginx/html/index.css
[unepicier@docker1 ~]$ cat /var/nginx/html/index.css
* {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Arial';
}
...

[unepicier@docker1 ~]$ sudo vim /var/nginx/custom.conf
[unepicier@docker1 ~]$ cat /var/nginx/custom.conf
server {
        listen 80;

        location / {
                root /var/www/tp4;
                index index.html;

                # Serve static files
                include /etc/nginx/mime.types;
        }
}
```

```sh
[unepicier@docker1 ~]$ docker run \
    --name web \ # Nom du conteneur
    -d \ # Lancement en tâche de fond
    -v /var/nginx/html:/var/www/tp4 \ # Page html custom
    -v /var/nginx/custom.conf:/etc/nginx/conf.d/custom.conf \ # Conf custom
    -p 8080:80 \ # Partage de port
    -m 512m \ # Limite d'utilisation de RAM
    --cpus=1 \ # Limite d'utilisation du CPU
    nginx
df830df416916054cb3c55fec713ab34f93571bb4bedab9570ca7cd0b0b1dfca

[unepicier@docker1 nginx]$ docker ps
CONTAINER ID   IMAGE     COMMAND                  CREATED         STATUS        PORTS                                   NAMES
df830df41691   nginx     "/docker-entrypoint.…"   2 seconds ago   Up 1 second   0.0.0.0:8080->80/tcp, :::8080->80/tcp   web
```

Cependant, on ne peut accéder au site que sur la VM, on ouvre donc le port dans le firewall

```sh
[unepicier@docker1 ~]$ sudo firewall-cmd --add-port=8080/tcp --permanent
success
[unepicier@docker1 ~]$ sudo firewall-cmd --reload
success
```

On vérifie sur notre PC

```sh
$ curl 10.104.1.11:8080
<!DOCTYPE html>
<html>
        <head>
                <title>Nginx - Home</title>
                <meta charset="utf8" />
                <link rel="stylesheet" href="/index.css">
        </head>
        <body>
                ...
        </body>
</html>
```

Et aussi sur notre host (la VM)

```sh
[unepicier@docker1 nginx]$ curl 172.17.0.1:8080
<!DOCTYPE html>
<html>
        <head>
                <title>Nginx - Home</title>
                <meta charset="utf8" />
                <link rel="stylesheet" href="/index.css">
        </head>
        <body>
                <div class="container">
                        <h1 class="title">Welcome on board!</h1>
                        <div class="btn-group">
                                <a href="google.com" class="btn">Google</a>
                                <a href="twitter.com" class="btn">Twitter</a>
                        </div>
                </div>
        </body>
</html>
```

Parfait!

## II. Images

### 2. Construisez votre propre Dockerfile

On prépare l'environnement de travail

```sh
[unepicier@docker1 ~]$ mkdir apache
[unepicier@docker1 ~]$ cd apache

[unepicier@docker1 apache]$ sudo cp /var/nginx/html/index.html ~/apache/index.html
[unepicier@docker1 apache]$ sudo cp /var/nginx/html/index.css ~/apache/index.css

[unepicier@docker1 apache]$ sudo vim custom.conf
[unepicier@docker1 apache]$ cat custom.conf
# on définit un port sur lequel écouter
Listen 80

# on charge certains modules Apache strictement nécessaires à son bon fonctionnement
LoadModule mpm_event_module "/usr/lib/apache2/modules/mod_mpm_event.so"
LoadModule dir_module "/usr/lib/apache2/modules/mod_dir.so"
LoadModule authz_core_module "/usr/lib/apache2/modules/mod_authz_core.so"

# on indique le nom du fichier HTML à charger par défaut
DirectoryIndex index.html
# on indique le chemin où se trouve notre site
DocumentRoot "/var/www/html/"

# quelques paramètres pour les logs
ErrorLog "logs/error.log"
LogLevel warn


[unepicier@docker1 apache]$ sudo vim Dockerfile
```

[Dockerfile](./Dockerfile)

On build

```sh
[unepicier@docker1 apache]$ ls
custom.conf  Dockerfile  index.css  index.html

[unepicier@docker1 apache]$ docker build . -t custom_apache
Sending build context to Docker daemon  6.144kB
Step 1/8 : FROM ubuntu
latest: Pulling from library/ubuntu
e96e057aae67: Pull complete
Digest: sha256:4b1d0c4a2d2aaf63b37111f34eb9fa89fa1bf53dd6e4ca954d47caebca4005c2
Status: Downloaded newer image for ubuntu:latest
 ---> a8780b506fa4
Step 2/8 : RUN apt update -y
 ---> Running in 54d7294d61d2

Get:1 http://archive.ubuntu.com/ubuntu jammy InRelease [270 kB]
...

Step 3/8 : RUN apt install -y apache2
...

Step 4/8 : RUN mkdir -p /var/www/html
 ---> Running in 6469b3093b36
Removing intermediate container 6469b3093b36
 ---> 4305ecd45517
Step 5/8 : ADD index.html /var/www/html/index.html
 ---> 372ccdfcd583
Step 6/8 : ADD index.css /var/www/html/index.css
 ---> a03a50acc178
Step 7/8 : ADD custom.conf /etc/apache2/apache2.conf
 ---> 69d48febc73b
Step 8/8 : CMD ["apache22", "-D", "FOREGROUND"]
 ---> Running in a7e04e5e5450
Removing intermediate container a7e04e5e5450
 ---> fc0ebcb2929e
Successfully built fc0ebcb2929e
Successfully tagged custom_apache:latest
```

On vérifie

```sh
[unepicier@docker1 apache]$ docker images
REPOSITORY      TAG       IMAGE ID       CREATED          SIZE
custom_apache   latest    fc0ebcb2929e   36 seconds ago   225MB
...
```

Et enfin on test

```sh
[unepicier@docker1 apache]$ docker run -p 8080:80 -d custom_apache
17d4bac4bc9795d739e3a606ad41ca977f53a66cc6f378e7db1eb78ecffb329c

[unepicier@docker1 apache]$ docker ps
CONTAINER ID   IMAGE           COMMAND                  CREATED         STATUS         PORTS                                   NAMES
17d4bac4bc97   custom_apache   "apache2 -D FOREGROU…"   3 seconds ago   Up 3 seconds   0.0.0.0:8080->80/tcp, :::8080->80/tcp   vigorous_chaplygin
```

On essaye de récupérer la page

```
[unepicier@docker1 apache]$ curl 10.104.1.11:8080
<!DOCTYPE html>
<html>
        <head>
                <title>Apache - Home</title>
                <meta charset="utf8" />
                <link rel="stylesheet" href="/index.css">
        </head>
        <body>
                ...
        </body>
</html>
```

## III. `docker-compose`

### 2. Make your own meow

On install git

```sh
[unepicier@docker1 ~]$ sudo dnf install git -y
...
Complete!
```

On clone notre projet (il est pas publique désolé)

```sh
[unepicier@docker1 ~]$ git clone https://github.com/UnEpicier/Clock.git
Cloning into 'Clock'...
Username for 'https://github.com': UnEpicier
Password for 'https://UnEpicier@github.com':
remote: Enumerating objects: 128, done.
remote: Counting objects: 100% (128/128), done.
remote: Compressing objects: 100% (80/80), done.
remote: Total 128 (delta 43), reused 108 (delta 26), pack-reused 0
Receiving objects: 100% (128/128), 66.10 KiB | 2.00 MiB/s, done.
Resolving deltas: 100% (43/43), done.
```

On va ensuite setup docker

```sh
# On se rends dans le dossier
[unepicier@docker1 ~]$ cd Clock
[unepicier@docker1 ~]$ sudo chown -R root:root Clock
```

Ensuite on build l'image

```sh
[unepicier@docker1 Clock]$ docker build . -t clock-js
```

On ouvre le port spécifié dans `docker-compose.yml` (si on lance à la main l'image, le port de base est `3000`)

```sh
[unepicier@docker1 ~]$ sudo firewall-cmd --add-port=8080/tcp --permanent
[unepicier@docker1 ~]$ sudo firewall-cmd --reload
```

Et enfin on lance

```sh
[unepicier@dcoker1 ~]$ docker compose up -d

[unepicier@docker1 Clock]$ docker ps
CONTAINER ID   IMAGE      COMMAND                  CREATED          STATUS          PORTS                                       NAMES
1165c8b124c5   clock-js   "docker-entrypoint.s…"   13 seconds ago   Up 12 seconds   0.0.0.0:8080->3000/tcp, :::8080->3000/tcp   clock-clock-1
```

On test

```sh
[unepicier@docker1 Clock]$ curl 10.104.1.11:8080
<!DOCTYPE html>
<html lang="en">

<head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Clock</title>
        <link rel="stylesheet" href="/stylesheets/__globals.css">
</head>

<body>
        <link rel="stylesheet" href="/stylesheets/pages/index.css">

<header class="header">
        <p class="toggle">AM/PM</p>
</header>

<div class="container">
        <p class="clock">
                <span id="clock">00:00:00</span>
        </p>
        <p class="date">JJ/MM/YYYY</p>
</div>
<script src="/javascript/index.js"></script>
        <link rel="stylesheet" href="/stylesheets/partials/footer.css">

        <footer class="footer">
                <p class="credits">Made by <span class="code">Un Épicier</span></p>
        </footer></body>

</html>
```

Nickel!
