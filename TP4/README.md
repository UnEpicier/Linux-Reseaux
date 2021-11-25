# TP4 : Une distribution orientée serveur
## Checklist
➜ Configuration IP statique
On change la conf de l'interface de la carte nommée `enp0s8`:
```sh
$ sudo cat /etc/sysconfig/network-scripts/ifcfg-enp0s8
TYPE=Ethernet
NAME=enp0s8
DEVICE=enp0s8
BOOTPROTO=static
ONBOOT=yes
IPADDR=10.250.1.69
NETMASK=255.255.255.0
```
Puis on reload l'interface pour appliquer les modifications:
```sh
$ sudo nmcli con reload
$ sudo nmcli con up enp0s8
```
Et enfin on regarde si les modifications ont bel et bien été appliquées:
```sh
$ ip a | grep -i enp0s8
3: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_code state UP group default qlen 1000
	inet 10.250.1.69/24 brd 10.250.1.255 scope global noprefixroute enp0s8
```
➜ Connexion SSH fonctionnelle
Dans un premier temps, on regarde que le service `sshd` est actif:
```sh
$ systemctl status sshd
sshd.service - OpenSSH server daemon
  Loaded: loaded (/usr/lib/systemd/system/sshd.service; enabled; vendor preset: enabled)
  Active: active (running)
```

Pour se connecter à la VM, on utilise un échange de clés:
- PC:
```sh
$ cat /home/unepicier/.ssh/id_rsa.pub
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDpbMGgn0vhlbt7yR/X4TJMYzQ3gklFNBWJzD1QetWajKi+bQRp4DNLi7vCajuOxHPRzX5TtiTHOWP/3v5mtXj7yEjCnWh6cJdXOyBtdLqssjQ9LYMgRgwNb6jkn/Gw9lA2o838o7pWPG80RR3AT2768RIQwH+1oeR3gRiuri8dZ0EYqQaOo9YZgWQwXnmeVq4kGC1wWeEVdSNzKOs3jskhztkGU8V34YKRBLNqk4brWtx/3aRxVjLYC/tkRAJI8q8wk9zZ3cLLTZaoUXK704t3M5NkB4++XvJL+Oh6BFZW/wX/L1txJBogG/y3xn+pHhQFqvUGmLu00MA7oCR8wo7+51zS+MP8jqIoFNJvY3UfLk5+jBaf6mtMDzSfpPm5MnP+Mf9+RIYrC2gcXd1ShMtKnYVC+xukf1aYV7dcOfqBCUEYF9yyTUUeUm7KZ8f4bixqqUPbM+u//uO3n1quagGM33b/9m0WD4HrPNc0i+ST5b7NwpKnKevP/DUVXI+KrZKcQFOCpT+16OEqNT3RDvBpwba05Ygb+rop1ffAzuQfUy+a75b5GjUkoEtuF/MSsrhKCnzEojrde623dM3bTtVw607XRRu4L5rD9gV1mw9oAtpFQmmeoBO63dg0Z75qhrDOSe+D0A6WaxtqmcZC1TtFH0F3Ri+c1l787BmDlEC9xw== unepicier@artemis
```

- VM:
```sh
$ cat .ssh/authorized_keys 
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDpbMGgn0vhlbt7yR/X4TJMYzQ3gklFNBWJzD1QetWajKi+bQRp4DNLi7vCajuOxHPRzX5TtiTHOWP/3v5mtXj7yEjCnWh6cJdXOyBtdLqssjQ9LYMgRgwNb6jkn/Gw9lA2o838o7pWPG80RR3AT2768RIQwH+1oeR3gRiuri8dZ0EYqQaOo9YZgWQwXnmeVq4kGC1wWeEVdSNzKOs3jskhztkGU8V34YKRBLNqk4brWtx/3aRxVjLYC/tkRAJI8q8wk9zZ3cLLTZaoUXK704t3M5NkB4++XvJL+Oh6BFZW/wX/L1txJBogG/y3xn+pHhQFqvUGmLu00MA7oCR8wo7+51zS+MP8jqIoFNJvY3UfLk5+jBaf6mtMDzSfpPm5MnP+Mf9+RIYrC2gcXd1ShMtKnYVC+xukf1aYV7dcOfqBCUEYF9yyTUUeUm7KZ8f4bixqqUPbM+u//uO3n1quagGM33b/9m0WD4HrPNc0i+ST5b7NwpKnKevP/DUVXI+KrZKcQFOCpT+16OEqNT3RDvBpwba05Ygb+rop1ffAzuQfUy+a75b5GjUkoEtuF/MSsrhKCnzEojrde623dM3bTtVw607XRRu4L5rD9gV1mw9oAtpFQmmeoBO63dg0Z75qhrDOSe+D0A6WaxtqmcZC1TtFH0F3Ri+c1l787BmDlEC9xw== unepicier@artemis
```

Et désormais, lorsque l'on souhaite se connecter à la VM:
```sh
$ ssh unepicier@10.250.1.69
Activate the web console with: systemctl enable --now cockpit.socket

Last login: Thu Nov 25 15:07:30 2021 from 10.250.1.40
[unepicier@localhost ~]$
```

➜ Accès internet
Maintenant, on teste la connexion à internet en utilisant la command `ping <ip>` pointant sur l'adresse IP du serveur de Google (8.8.8.8):
```sh
[unepicier@localhost ~]$ ping 8.8.8.8 -c 5
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=63 time=25.6 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=63 time=129 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=63 time=28.4 ms
64 bytes from 8.8.8.8: icmp_seq=4 ttl=63 time=234 ms
64 bytes from 8.8.8.8: icmp_seq=5 ttl=63 time=74.6 ms

--- 8.8.8.8 ping statistics ---
5 packets transmitted, 5 received, 0% packet loss, time 4005ms
rtt min/avg/max/mdev = 25.552/98.305/234.465/77.727 ms
```

Puis on teste également que la machine est capable de faire de la résolution de nom. Pour cela on fait exactement la même commande mais en remplaçant l'adresse IP par `google.com`:
```sh
[unepicier@localhost ~]$ ping google.com -c 5
PING google.com (142.250.201.174) 56(84) bytes of data.
64 bytes from par21s23-in-f14.1e100.net (142.250.201.174): icmp_seq=1 ttl=63 time=24.6 ms
64 bytes from par21s23-in-f14.1e100.net (142.250.201.174): icmp_seq=2 ttl=63 time=23.8 ms
64 bytes from par21s23-in-f14.1e100.net (142.250.201.174): icmp_seq=3 ttl=63 time=23.7 ms
64 bytes from par21s23-in-f14.1e100.net (142.250.201.174): icmp_seq=4 ttl=63 time=22.10 ms
64 bytes from par21s23-in-f14.1e100.net (142.250.201.174): icmp_seq=5 ttl=63 time=22.5 ms

--- google.com ping statistics ---
5 packets transmitted, 5 received, 0% packet loss, time 4006ms
rtt min/avg/max/mdev = 22.462/23.497/24.564/0.725 ms
```
➜ Nommage de la machine
On renomme le nom de la machine
```sh
[unepicier@localhost ~]$ cat /etc/hostname
node1.tp4.linux
[unepicier@localhost ~]$ hostname
node1.tp4.linux
```
## III. Mettre en place un service
### 1. Install de NGINX
Pour installer NGINX, on fait:
```sh
$ sudo dnf upgrade # On update tout les packages installés
$ sudo dnf install nginx # on installe nginx
```
Puis on vérifie l'installation:
```sh
$ nginx -v
nginx version: nginx/1.14.1
```
### 2. Analyse
On détermine sous quel user tourne le processus du service NGINX:
```sh
$ ps -ef | grep nginx
root        4386       1  0 15:40 ?        00:00:00 nginx: master process /usr/sbin/nginx
nginx       4387    4386  0 15:40 ?        00:00:00 nginx: worker process
```
Le processus tourne donc sous l'utilisateur nginx
On détermine ensuite derrière quel port écoute le serveur web:
```sh
$ sudo ss -tunlp | grep nginx
tcp   LISTEN 0      128          0.0.0.0:80        0.0.0.0:*    users:(("nginx",pid=4387,fd=8),("nginx",pid=4386,fd=8))
tcp   LISTEN 0      128             [::]:80           [::]:*    users:(("nginx",pid=4387,fd=9),("nginx",pid=4386,fd=9))
```
On voie qu'il écoute donc sous le port 80.
On regarde où est la racine web dans la machine:
```sh
$ cat /etc/nginx/nginx.conf
    server {
        listen       80 default_server;
        listen       [::]:80 default_server;
        server_name  _;
        root         /usr/share/nginx/html;
```
La racine est donc sous `/usr/share/nginx/html`
Et enfin, on vérifie que les fichiers soient accessibles en lecture:
```sh
$ ls -l
total 20
-rw-r--r--. 1 root root 3332 Jun 10 11:09 404.html
-rw-r--r--. 1 root root 3404 Jun 10 11:09 50x.html
-rw-r--r--. 1 root root 3429 Jun 10 11:09 index.html
-rw-r--r--. 1 root root  368 Jun 10 11:09 nginx-logo.png
-rw-r--r--. 1 root root 1800 Jun 10 11:09 poweredby.png
```
On voit donc bien que la lettre `r` pour read est présente et permet donc la lecture.

### 3. Visite du service web
Dans un premier temps, on autorise le traffic vers le service NGINX (port: 80) en configurant le firewall:
```sh
$ sudo firewall-cmd --add-port=80/tcp --permanent
success
$ sudo firewall-cmd --reload
success
```
Puis on vérifie qu'on puisse y accéder depuis l'extérieur de la VM:
```sh
$ curl -I 10.250.1.69:80
HTTP/1.1 200 OK
Server: nginx/1.14.1
```

### 4. Modif de la conf du serveur web

**Changer le port d'écoute**
```sh
$ cat /etc/nginx/nginx.conf
    server {
        listen       8080 default_server;
        listen       [::]:8080 default_server;

$ sudo systemctl restart nginx
$ systemctl status nginx
● nginx.service - The nginx HTTP and reverse proxy server
   Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; vendor preset: disabled)
   Active: active (running)
   
$ sudo ss -tunlp | grep nginx
tcp   LISTEN 0      128          0.0.0.0:8080      0.0.0.0:*    users:(("nginx",pid=4676,fd=8),("nginx",pid=4675,fd=8))
tcp   LISTEN 0      128             [::]:8080         [::]:*    users:(("nginx",pid=4676,fd=9),("nginx",pid=4675,fd=9))

$ sudo firewall-cmd --remove-port=80/tcp --permanent
success

$ sudo firewall-cmd --add-port=8080/tcp --permanent
success

$ sudo firewall-cmd --reload
success

$ curl -I 10.250.1.69:8080
HTTP/1.1 200 OK
Server: nginx/1.14.1
```

**Changer l'utilisateur qui lance le service**

On créer l'utilisateur `web`:
```sh
$ sudo useradd web --password 12345 -m -d /home/web
useradd: warning: the home directory already exists.
Not copying any file from skel directory into it.
Creating mailbox file: File exists
```
Ensuite on change l'utilisateur sous lequel nginx se lance:
```sh
$ cat /etc/nginx/nginx.conf
user nginx;
$ cat /etc/nginx/nginx.conf
user web;
```
Et maintenant on vérifie que la modification a été effectué:
```sh
$ ps -ef | grep nginx
root        4780       1  0 16:35 ?        00:00:00 nginx: master process /usr/sbin/nginx
web         4781    4780  0 16:35 ?        00:00:00 nginx: worker process
```

**Changer l'emplacement de la racine web**
```sh
 $ cd /var/
$ sudo mkdir www www/super_site_web
$ sudo chown -R web www/
$ sudo nano www/super_site_web/index.html
$ cat www/super_site_web/index.html 
<!DOCTYPE html>
<html>
        <head>
                <meta charset="UTF-8">
                <title>TP 4</title>
        </head> 
        <body>
                <h1>Lourd le site</h1>
        </body>
</html>
$ sudo chown  web www/super_site_web/index.html
```
```sh
$ sudo nano /etc/nginx/nginx.conf
$ cat /etc/nginx/nginx.conf
    server {
        listen       8080 default_server;
        listen       [::]:8080 default_server;
        server_name  _;
        root         /var/www/super_site_web;
$ sudo systemctl restart nginx
$ curl -L 10.250.1.69:8080
<!DOCTYPE html>
<html>
        <head>
                <meta charset="UTF-8">
                <title>TP 4</title>
        </head> 
        <body>
                <h1>Lourd le site</h1>
        </body>
</html>
```