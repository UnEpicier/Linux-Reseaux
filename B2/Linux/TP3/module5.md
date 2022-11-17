# Module 5: Monitoring

Toutes les commandes (sauf précision) seront faites sur les machines:

- `web.tp2.linux`
- `db.tp2.linux`

## I. Install

Dans un premier temps, on installe tout le nécessaire

```sh
[unepicier@web ~]$ sudo dnf update -y
[unepicier@web ~]$ sudo dnf install epel-release -y
[unepicier@web ~]$ sudo dnf install wget -y

# On installe donc Netdata
[unepicier@web ~]$ wget -O /tmp/netdata-kickstart.sh https://my-netdata.io/kickstart.sh && sh /tmp/netdata-kickstart.sh

# On lance netdata
[unepicier@web ~]$ sudo systemctl start netdata
[unepicier@web ~]$ sudo systemctl enable netdata
[unepicier@web ~]$ systemctl status netdata
...
active
...
```

On cherche sur quel port utilise netdata:

```sh
[unepicier@web ~]$ sudo ss -laputn | grep netdata
udp   UNCONN    0      0               127.0.0.1:8125             0.0.0.0:*     users:(("netdata",pid=2491,fd=35))
udp   UNCONN    0      0                   [::1]:8125                [::]:*     users:(("netdata",pid=2491,fd=34))
tcp   LISTEN    0      4096              0.0.0.0:19999            0.0.0.0:*     users:(("netdata",pid=2491,fd=6))
tcp   LISTEN    0      4096            127.0.0.1:8125             0.0.0.0:*     users:(("netdata",pid=2491,fd=56))
tcp   LISTEN    0      4096                 [::]:19999               [::]:*     users:(("netdata",pid=2491,fd=7))
tcp   LISTEN    0      4096                [::1]:8125                [::]:*     users:(("netdata",pid=2491,fd=55))
```

Grâce à la doc, on sait que le port à ouvrir dans le firewall est 19999.

```sh
[unepicier@web ~]$ sudo firewall-cmd --add-port=19999/tcp --permanent
success
[unepicier@web ~]$ sudo firewall-cmd --reload
success
```

Et lorsque l'on fait un curl sur notre PC (physique):

```sh
# De même pour 10.102.1.12 (db)
$ curl 10.102.1.11:19999
<!doctype html><html lang="en">
    <head>
        <title>netdata dashboard</title>
        ...
    </head>
    <body data-spy="scroll" data-target="#sidebar" data-offset="100">
        ...
    </body>
</html>
```

## Alertes Discord

On créer en amont sur discord un `Webhook` où on récupère son lien.

```sh
# On remplie la conf (partie discord) pour recevoir des notifs
[unepicier@web ~]$ sudo /etc/netdata/edit-config health_alarm_notify.conf

# On créer une alerte
[unepicier@web ~]$ cd /etc/netdata
[unepicier@web netdata]$ sudo vim health.d/cpu_usage.conf # On créer un fichier vide
[unepicier@web netdata]$ sudo ./edit-config health.d/cpu_usage.conf # On edit le fichier
[unepicier@web netdata]$ cat health.d/cpu_usage.conf
alarm: cpu_usage
on: system.cpu
lookup: average -3s percentage foreach user,system
units: %
every: 10s
warn: $this > 50
crit: $this > 80
info: CPU utilization of users or the system itself.
[unepicier@web netdata]$ sudo netdata-cli reload-health
```

Donc maintenant on a une alerte, on vérifie sur le site qu'elle existe, puis on va faire un stress test

```sh
[unepicier@web netdata]$ sudo dnf install stress-ng -y
[unepicier@web netdata]$ sudo stress-ng -c 10 -l 60
```

Ce stress test fait monter le CPu à 100% et envoie en quelques secondes un petit message "critique" sur le channel discord !!
