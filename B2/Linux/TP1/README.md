# TP1 : (re)Familiaration avec un système GNU/Linux

## Sommaire

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
