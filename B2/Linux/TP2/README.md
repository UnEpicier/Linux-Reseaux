# TP2: Gestion de service

## I. Un premier serveur web

### 1. Installation

🌞 Installer le serveur Apache

```sh
[unepicier@web ~]$ sudo dnf install httpd -y

# Pour supprimer les commentaires
[unepicier@web ~]$ sudo vim /etc/httpd/conf/httpd.conf
```

🌞 Démarrer le service Apache

On démarre Apache et on le lance au démarrage

```sh
[unepicier@web ~]$ sudo systemctl start httpd
[unepicier@web ~]$ sudo systemctl enable httpd
Created symlink /etc/systemd/system/multi-user.target.wants/httpd.service → /usr/lib/systemd/system/httpd.service.
```

On cherche le port qu'écoute Apache et on l'autorise dans le firewall

```
[unepicier@web ~]$ sudo ss -laptn | grep httpd
LISTEN 0      511                *:80              *:*     users:(("httpd",pid=1191,fd=4),("httpd",pid=1190,fd=4),("httpd",pid=1189,fd=4),("httpd",pid=1187,fd=4))
[unepicier@web ~]$ sudo firewall-cmd --add-port=80/tcp --permanent
success
[unepicier@web ~]$ sudo firewall-cmd --reload
success
[unepicier@web ~]$ sudo firewall-cmd --list-ports
22/tcp 80/tcp
```

🌞 TEST

- Le service est démarré

  ```sh
  [unepicier@web ~]$ systemctl status httpd
  ● httpd.service - The Apache HTTP Server
  Loaded: loaded (/usr/lib/systemd/system/httpd.service; enabled; vendor preset: disabled)
  Active: active (running) since Tue 2022-11-15 10:18:13 CET; 5min ago
  Docs: man:httpd.service(8)
  Main PID: 1187 (httpd)
  Status: "Total requests: 0; Idle/Busy workers 100/0;Requests/sec: 0; Bytes served/sec: 0 B/sec"
  Tasks: 213 (limit: 5906)
  Memory: 23.2M
  CPU: 163ms
  CGroup: /system.slice/httpd.service
  ├─1187 /usr/sbin/httpd -DFOREGROUND
  ├─1188 /usr/sbin/httpd -DFOREGROUND
  ├─1189 /usr/sbin/httpd -DFOREGROUND
  ├─1190 /usr/sbin/httpd -DFOREGROUND
  └─1191 /usr/sbin/httpd -DFOREGROUND

    Nov 15 10:18:13 web.tp2.linux systemd[1]: Starting The Apache HTTP Server...
    Nov 15 10:18:13 web.tp2.linux systemd[1]: Started The Apache HTTP Server.
    Nov 15 10:18:13 web.tp2.linux httpd[1187]: Server configured, listening on: port 80
  ```

- Vérifier qu'il est configuré pour démarrer automatiquement

  ```sh
  [unepicier@web ~]$ systemctl is-enabled httpd
  enabled
  ```

- Vérifier avec une commande curl localhost que vous joignez votre serveur web localement

  ```sh
  [unepicier@web ~]$ curl localhost
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

  Et sur notre PC:

  ```sh
  $ curl 10.102.1.11:80
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

### 2. Avancer vers la maîtrise du service

🌞 Le service Apache...

```sh
[unepicier@web ~]$ sudo cat /etc/systemd/system/multi-user.target.wants/httpd.service
# See httpd.service(8) for more information on using the httpd service.

# Modifying this file in-place is not recommended, because changes
# will be overwritten during package upgrades.  To customize the
# behaviour, run "systemctl edit httpd" to create an override unit.

# For example, to pass additional options (such as -D definitions) to
# the httpd binary at startup, create an override unit (as is done by
# systemctl edit) and enter the following:

#       [Service]
#       Environment=OPTIONS=-DMY_DEFINE

[Unit]
Description=The Apache HTTP Server
Wants=httpd-init.service
After=network.target remote-fs.target nss-lookup.target httpd-init.service
Documentation=man:httpd.service(8)

[Service]
Type=notify
Environment=LANG=C

ExecStart=/usr/sbin/httpd $OPTIONS -DFOREGROUND
ExecReload=/usr/sbin/httpd $OPTIONS -k graceful
# Send SIGWINCH for graceful stop
KillSignal=SIGWINCH
KillMode=mixed
PrivateTmp=true
OOMPolicy=continue

[Install]
WantedBy=multi-user.target
```

🌞 Déterminer sous quel utilisateur tourne le processus Apache

- Mettez en évidence la ligne dans le fichier de conf principal d'Apache (httpd.conf) qui définit quel user est utilisé

  ```sh
  [unepicier@web ~]$ cat /etc/httpd/conf/httpd.conf | grep User
  User apache
  ```

- Utilisez la commande ps -ef pour visualiser les processus en cours d'exécution et confirmer que apache tourne bien sous l'utilisateur mentionné dans le fichier de conf

  ```sh
  [unepicier@web ~]$ ps -ef | grep httpd
  root        1187       1  0 10:18 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
  apache      1188    1187  0 10:18 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
  apache      1189    1187  0 10:18 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
  apache      1190    1187  0 10:18 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
  apache      1191    1187  0 10:18 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
  ```

- La page d'accueil d'Apache se trouve dans /usr/share/testpage/

  - Vérifiez avec un ls -al que tout son contenu est accessible en lecture à l'utilisateur mentionné dans le fichier de conf

            ```sh
            [unepicier@web testpage]$ ls -al | tail -1
            -rw-r--r--. 1 root root 7620 Jul 6 04:37 index.html
            ```

🌞 Changer l'utilisateur utilisé par Apache

```sh
[unepicier@web testpage]$ sudo cat /etc/passwd | grep apache
apache:x:48:48:Apache:/usr/share/httpd:/sbin/nologin
[unepicier@web testpage]$ sudo useradd web -m -d /usr/share/httpd -s /bin/bash
useradd: warning: the home directory /usr/share/httpd already exists.
useradd: Not copying any file from skel directory into it.
Creating mailbox file: File exists
```

On restart Apache et on vérifie que les changements siont bien appliqués

```sh
[unepicier@web testpage]$ sudo systemctl restart httpd
[unepicier@web testpage]$ systemctl status httpd
● httpd.service - The Apache HTTP Server
     Loaded: loaded (/usr/lib/systemd/system/httpd.service; enabled; vendor preset: disabled)
     Active: active (running) since Tue 2022-11-15 10:56:03 CET; 6s ago
       Docs: man:httpd.service(8)
   Main PID: 1803 (httpd)
     Status: "Started, listening on: port 80"
      Tasks: 213 (limit: 5906)
     Memory: 22.7M
        CPU: 51ms
     CGroup: /system.slice/httpd.service
             ├─1803 /usr/sbin/httpd -DFOREGROUND
             ├─1804 /usr/sbin/httpd -DFOREGROUND
             ├─1805 /usr/sbin/httpd -DFOREGROUND
             ├─1806 /usr/sbin/httpd -DFOREGROUND
             └─1807 /usr/sbin/httpd -DFOREGROUND

Nov 15 10:56:02 web.tp2.linux systemd[1]: Starting The Apache HTTP Server...
Nov 15 10:56:03 web.tp2.linux systemd[1]: Started The Apache HTTP Server.
Nov 15 10:56:03 web.tp2.linux httpd[1803]: Server configured, listening on: port 80
[unepicier@web testpage]$ ps -ef | grep httpd
root        1803       1  0 10:56 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
web         1804    1803  0 10:56 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
web         1805    1803  0 10:56 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
web         1806    1803  0 10:56 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
web         1807    1803  0 10:56 ?        00:00:00 /usr/sbin/httpd -DFOREGROUND
```

🌞 Faites en sorte que Apache tourne sur un autre port

```sh
[unepicier@web ~]$ sudo cat /etc/httpd/conf/httpd.conf | grep Listen
Listen 80
[unepicier@web ~]$ sudo vim /etc/httpd/conf/httpd.conf
[unepicier@web ~]$ sudo cat /etc/httpd/conf/httpd.conf | grep Listen
Listen 8080

[unepicier@web ~]$ sudo firewall-cmd --remove-port=80/tcp --permanent
success
[unepicier@web ~]$ sudo firewall-cmd --add-port=8080/tcp --permanent
success
[unepicier@web ~]$ sudo firewall-cmd --reload
success
[unepicier@web ~]$ sudo firewall-cmd --list-ports
22/tcp 8080/tcp
[unepicier@web ~]$ sudo systemctl restart httpd
[unepicier@web ~]$ sudo ss -laputn | grep httpd
tcp   LISTEN 0      511                   *:8080            *:*     users:(("httpd",pid=2115,fd=4),("httpd",pid=2114,fd=4),("httpd",pid=2113,fd=4),("httpd",pid=2111,fd=4))

[unepicier@web ~]$ curl localhost:8080
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

Et on test sur notre PC:

```sh
$ curl 10.102.1.11:8080
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
