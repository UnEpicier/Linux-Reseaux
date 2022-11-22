# Module 7: Fail2ban

Toutes les commandes seront effectuées sur:

- `web.tp2.linux`
- `db.tp2.linux`

## Setup

```sh
[unepicier@web srv]$ sudo dnf install fail2ban fail2ban-firewalld -y
Complete!

[unepicier@web ~]$ sudo systemctl start fail2ban
[unepicier@web ~]$ sudo systemctl enable fail2ban
Created symlink /etc/systemd/system/multi-user.target.wants/fail2ban.service → /usr/lib/systemd/system/fail2ban.service.
[unepicier@web ~]$ sudo systemctl status fail2ban
● fail2ban.service - Fail2Ban Service
     Loaded: loaded (/usr/lib/systemd/system/fail2ban.service; enabled; vendor preset: disabled)
     Active: active (running) since Mon 2022-11-21 12:26:55 CET; 5s ago

[unepicier@web ~]$ sudo dnf install epel-release
Complete!
```

# Création des jails

```sh
[unepicier@web ~]$ sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
[unepicier@web ~]$ sudo vim /etc/fail2ban/jail.local
[unepicier@web ~]$ sudo cat /etc/fail2ban/jail.local
...
ignoreip = 127.0.0.1 ::1
...
```

Par défaut, fail2ban fonctionne avec iptables mais on va le changer pour qu'il travaille avec firewalld

```sh
[unepicier@web ~]$ sudo mv /etc/fail2ban/jail.d/00-firewalld.conf /etc/fail2ban/jail.d/00-firewalld.local
```

On restart

```sh
[unepicier@web ~]$ sudo systemctl restart fail2ban
```

Maintenant on setup fail2ban pour ssh

```sh
[unepicier@web ~]$ sudo vim /etc/fail2ban/jail.d/sshd.local
[unepicier@web ~]$ sudo cat /etc/fail2ban/jail.d/sshd.local
[sshd]
enabled = true

# Override default values

bantime = -1
findtime = 1m
maxretry = 3
```

On restart

```sh
[unepicier@web ~]$ sudo systemctl restart fail2ban
[unepicier@web ~]$ sudo fail2ban-client status
Status
|- Number of jail:      1
`- Jail list:   sshd
```

Et on regarde aussi qu'on a bien override le maxretry par exemple

```sh
[unepicier@web ~]$ sudo fail2ban-client get sshd maxretry
3
```

Parfait !

Maintenant, on test en se faisant ban

```sh
$ ssh unepicier@10.102.1.11
unepicier@10.102.1.11's password:
Permission denied, please try again.

unepicier@10.102.1.11's password:
Permission denied, please try again.

unepicier@10.102.1.11's password:
unepicier@10.102.1.11: Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password).
```

Dans le firewall on peut donc voir ceci:

```sh
[unepicier@web ~]$ sudo firewall-cmd --list-rich-rules
rule family="ipv4" source address="10.102.1.1" port port="ssh" protocol="tcp" reject type="icmp-port-unreachable"
```

Et enfin pour unban on fait

```sh
$ sudo fail2ban-client unban 10.102.1.1
1
```

On vérifie

```sh
[unepicier@web ~]$ sudo firewall-cmd --list-rich-rules

[unepicier@web ~]$
```

On retente de se connecter

```sh
$ ssh unepicier@10.102.1.11
unepicier@10.102.1.11's password:
Last login: Tue Nov 22 10:17:32 2022
[unepicier@web ~]$
```

Parfait !
