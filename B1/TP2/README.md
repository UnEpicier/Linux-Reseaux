# TP2 : Explorer et manipuler le système

## I - Prérequis
### 1. Nommer la machine
```sh=
unepicier@lepicerie:~$ sudo hostname node1.tp2.linux
unepicier@lepicerie:~$ sudo nano /etc/hostname
unepicier@lepicerie:~$ cat /etc/hostname
node1.tp2.linux
```

Au redémarrage du terminal on a donc: 
```sh
unepicier@node1:~$ 
```

### 2. Config réseau

- Ping à l'adresse 1.1.1.1:
```sh=
unepicier@lepicerie:~$ ping 1.1.1.1 -c 1
PING 1.1.1.1 (1.1.1.1) 56(84) bytes of data.
64 bytes from 1.1.1.1: icmp_seq=1 ttl=63 time=96.1 ms

--- 1.1.1.1 ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 96.109/96.109/96.109/0.000 ms
```

- Ping à l'adresse de ynov.com:
```sh=
unepicier@lepicerie:~$ ping 1.1.1.1 -c 1
PING ynov.com (92.243.16.143) 56(84) bytes of data.
64 bytes from xvm-16-143.dc0.ghst.net (92.243.16.143): icmp_seq=1 ttl=63 time=102 ms

--- ynov.com ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 102.147/102.147/102.147/0.000 ms
```

- Ping depuis notre PC à la machine virtuelle:
```sh=
unepicier@lepicerie:~$ ping 192.168.56.112 -c 1
PING 192.168.56.112 (192.168.56.112) 56(84) octets de données.
64 octets de 192.168.56.112 : icmp_seq=1 ttl=64 temps=0.266 ms

--- statistiques ping 192.168.56.112 ---
1 paquets transmis, 1 reçus, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 0.266/0.266/0.266/0.000 ms
```

## II - Setup du serveur SSH
### 1. Installation du serveur

- On télécharge le serveur SSH via la commande apt
```sh
unepicier@node1:~$ sudo apt install openssh-server
```

### 2. Lancement du service SSH

- On lance le service SSH
```sh
unepicier@node1:~$ systemctl start ssh
```

- On vérifie qu'il soit bien lancé
```sh=
unepicier@node1:~$ systemctl status ssh
● sshd.service - OpenSSH Daemon
     Loaded: loaded (/lib/systemd/system/sshd.service; enabled; vendor preset: disabled)
     Active: active (running) since Mon 2021-10-25 15:17:23 CEST; 1h 19min ago
       Docs: man:sshd(8)
             man:sshd_config(5)
   Main PID: 1473 (sshd)
      Tasks: 1 (limit: 2312)
     Memory: 1.1M
        CPU: 120ms
     CGroup: /system.slice/sshd.service
             └─1473 sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups
```

### 3. Etude du service SSH

- On vérifie qu'il soit bien lancé
```sh=
unepicier@node1:~$ systemctl status ssh
● sshd.service - OpenSSH Daemon
     Loaded: loaded (/lib/systemd/system/sshd.service; enabled; vendor preset: disabled)
     Active: active (running) since Mon 2021-10-25 15:17:23 CEST; 1h 19min ago
       Docs: man:sshd(8)
             man:sshd_config(5)
   Main PID: 1473 (sshd)
      Tasks: 1 (limit: 2312)
     Memory: 1.1M
        CPU: 120ms
     CGroup: /system.slice/sshd.service
             └─1473 sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups
```

- On affiche les processus liés au service `ssh`
```sh=
unepicier@node1:~$ ps -A | grep -F ssh
    859 ?        00:00:00 ssh-agent
   1473 ?        00:00:00 sshd
   2315 ?        00:00:00 sshd
   2368 ?        00:00:00 sshd
```

- On affiche le port utilisé par le service `ssh`
```sh=
unepicier@node1:~$ sudo ss -ltnp
State             Recv-Q            Send-Q                       Local Address:Port                       Peer Address:Port           Process                                              
LISTEN            0                 128                                0.0.0.0:22                              0.0.0.0:*               users:(("sshd",pid=1473,fd=3))          
LISTEN            0                 128                                   [::]:22                                 [::]:*               users:(("sshd",pid=1473,fd=4))
```

- On affiche les logs du service `ssh`
```sh=
unepicier@node1:~$ cd /var/log/ && journalctl | grep -F ssh
oct. 19 16:21:37 artemis systemd[689]: Listening on GnuPG cryptographic agent (ssh-agent emulation).
oct. 19 16:22:01 artemis systemd[769]: Listening on GnuPG cryptographic agent (ssh-agent emulation).
```

- Se connecter au serveur SSH
Sur la VM:
```sh=
unepicier@node1:~$ ip a
3: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 08:00:27:ec:02:26 brd ff:ff:ff:ff:ff:ff
    inet 192.168.56.112/24 brd 192.168.56.255 scope global dynamic noprefixroute enp0s8
        valid_lft 368sec preferred_lft 368sec
    inet6 fe80::86fa::564d:e07c:2cb6/64 scope link noprefixroute
        valid_lft forever preferred_lft forever
```
On récupère l'adresse IPV4: `192.168.56.112`
```sh=
ssh unepicier@192.168.56.112
unepicier@node1:~$ 
```

### 4. Modification de la configuration du serveur

- On modifie le port d'écoute du service `ssh` à 1025
```sh=
unepicier@node1:~$ sudo nano /etc/ssh/sshd_config
unepicier@node1:~$ cat /etc/ssh/sshd_config
#       $OpenBSD: sshd_config,v 1.103 2018/04/09 20:41:22 tj Exp $

# This is the sshd server system-wide configuration file.  See
# sshd_config(5) for more information.

# This sshd was compiled with PATH=/usr/bin:/bin:/usr/sbin:/sbin

# The strategy used for options in the default sshd_config shipped with
# OpenSSH is to specify options with their default value where
# possible, but leave them commented.  Uncommented options override the
# default value.

Include /etc/ssh/sshd_config.d/*.conf

Port 1025

unepicier@node1:~$ ss -l | grep -F 1025
tcp     LISTEN   0        128                                           0.0.0.0:1025                                      0.0.0.0:*
tcp     LISTEN   0        128                                              [::]:1025                                         [::]:*
```

## III - Setup du serveur FTP
### 1. Installation du serveur
On installe tout d'abord le paquet `vsftpd`
```sh=
unepicier@node1:~$ sudo apt install vsftpd
```
Puis on vérifie qu'il soit bien installé en regardant qu'il y a bien son fichier de configuration
```sh=
unepicier@node1:~$ ls /etc/ | grep -F vsftpd
vsftpd.conf
```

### 2. Lancement du service FTP
On démarre le service, on l'inclus dans les services à démarrer automatiquement, puis on vérifie qu'il soit actuellement actif
```sh=
unepicier@node1:~$ sudo systemctl start vsftpd

unepicier@node1:~$ sudo systemctl enable vsftpd
Synchronizing state of vsftpd.service with SysV service script with /lib/systemd/systemd-sysv-install.
Executing: /lib/systemd/systemd-sysv-install enable vsftpd

unepicier@node1:~$ sudo systemctl status vsftpd
● vsftpd.service - vsftpd FTP server
     Loaded: loaded (/lib/systemd/system/vsftpd.service; enabled; vendor preset: enabled)
     Active: active (running) since Sun 2021-11-07 17:25:53 CET; 7min ago
   Main PID: 1598 (vsftpd)
      Tasks: 1 (limit: 2312)
     Memory: 532.0K
     CGroup: /system.slice/vsftpd.service
             └─1598 /usr/sbin/vsftpd /etc/vsftpd.conf

nov. 07 17:25:53 node1.tp2.linux systemd[1]: Starting vsftpd FTP server...
nov. 07 17:25:53 node1.tp2.linux systemd[1]: Started vsftpd FTP server.
```

### 3. Etude du service FTP
On vérifie qu'il soit bien lancé
```sh=
unepicier@node1:~$ sudo systemctl status vsftpd
● vsftpd.service - vsftpd FTP server
     Loaded: loaded (/lib/systemd/system/vsftpd.service; enabled; vendor preset: enabled)
     Active: active (running) since Sun 2021-11-07 17:25:53 CET; 7min ago
   Main PID: 1598 (vsftpd)
      Tasks: 1 (limit: 2312)
     Memory: 532.0K
     CGroup: /system.slice/vsftpd.service
             └─1598 /usr/sbin/vsftpd /etc/vsftpd.conf

nov. 07 17:25:53 node1.tp2.linux systemd[1]: Starting vsftpd FTP server...
nov. 07 17:25:53 node1.tp2.linux systemd[1]: Started vsftpd FTP server.
```

On affiche les processus lié au service `vsftpd`
```sh=
unepicier@node1:~$ ps -A | grep -F vsftpd
   1598 ?        00:00:00 vsftpd
```

On affiche le port utilisé par le service
```sh=
unepicier@node1:~$ sudo ss -ltnp | grep -F vsftpd
LISTEN    0         32                       *:21                     *:*        users:(("vsftpd",pid=1598,fd=3))
```

On affiche les logs du service
```sh=
unepicier@node1:~$ cd /var/log/ &&  journalctl | grep -F vsftpd
nov. 07 17:25:35 node1.tp2.linux sudo[1423]: unepicier : TTY=pts/1 ; PWD=/home/unepicier ; USER=root ; COMMAND=/usr/bin/apt-get vsftpd
nov. 07 17:25:47 node1.tp2.linux sudo[1425]: unepicier : TTY=pts/1 ; PWD=/home/unepicier ; USER=root ; COMMAND=/usr/bin/apt install vsftpd
nov. 07 17:25:53 node1.tp2.linux systemd[1]: Starting vsftpd FTP server...
nov. 07 17:25:53 node1.tp2.linux systemd[1]: Started vsftpd FTP server.
nov. 07 17:31:35 node1.tp2.linux sudo[16041]: unepicier : TTY=pts/1 ; PWD=/home/unepicier ; USER=root ; COMMAND=/usr/bin/systemctl start vsftpd
nov. 07 17:33:20 node1.tp2.linux sudo[16055]: unepicier : TTY=pts/1 ; PWD=/home/unepicier ; USER=root ; COMMAND=/usr/bin/systemctl enable vsftpd
nov. 07 17:33:42 node1.tp2.linux sudo[16122]: unepicier : TTY=pts/1 ; PWD=/home/unepicier ; USER=root ; COMMAND=/usr/bin/systemctl status vsftpd
```

On se connecte au serveur FTP avec un client FTP, puis, on essayons upload puis download un fichier. Voici les logs de ces deux opérations:
```sh=

```

### 4. Modification de la configuration du serveur
On change le port d'écoute du service ftp:
```sh=
unepicier@node1:~$ sudo nano /etc/vsftpd.conf
unepicier@node1:~$ cat /etc/vsftpd.conf
# Example config file /etc/vsftpd.conf
#
# The default compiled in settings are fairly paranoid. This sample file
# loosens things up a bit, to make the ftp daemon more usable.
# Please see vsftpd.conf.5 for all compiled in defaults.
#
# READ THIS: This example file is NOT an exhaustive list of vsftpd options.
# Please read the vsftpd.conf.5 manual page to get a full idea of vsftpd's
# capabilities.
#
#
# Run standalone?  vsftpd can run either from an inetd or as a standalone
# daemon started from an initscript.
listen=NO
listen_port=1026
```

Pour vérifier que la modification a été prise en compte, on fait
```sh=
unepicier@node1:~$ sudo systemctl restart vsftpd
unepicier@node1:~$ sudo ss -ltnp | grep -F ftp
LISTEN    0         32                       *:1026                   *:*        users:(("vsftpd",pid=16794,fd=3))
```
