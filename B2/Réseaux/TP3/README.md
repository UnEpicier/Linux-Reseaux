# TP3 : On va router des trucs

## Prérequis

Pour ce TP, nous aurons besoin de deux VM sous Rocky Linux.
<br/>
Les machines porteront un surnom chacun:

- Machine 1: `jhon`
- Machine 2: `marcel`

Les adresses IP seront définis à la main et précisées.

## I. ARP

Voici les IPs pour cette partie:

| Machine  | 10.3.1.0/24 |
| -------- | ----------- |
| `jhon`   | `10.3.1.11` |
| `marcel` | `10.3.1.12` |

### 1. Échange ARP

🌞 Générer des requêtes ARP

- Effectuer un `ping` d'une machine à l'autre

  ```sh
  # Machine 1
  $ ping 10.3.1.12 -c 4

  PING 10.3.1.12 (10.3.1.12) 56(84) bytes of data.
  64 bytes from 10.3.1.12: icmp_seq=1 ttl=64 time=0.406 ms
  64 bytes from 10.3.1.12: icmp_seq=2 ttl=64 time=0.983 ms
  64 bytes from 10.3.1.12: icmp_seq=3 ttl=64 time=0.935 ms
  64 bytes from 10.3.1.12: icmp_seq=4 ttl=64 time=0.976 ms
  ```

  ```sh
  # Machine 2
  $ ping 10.3.1.11 -c 4

  PING 10.3.1.11 (10.3.1.11) 56(84) bytes of data.
  64 bytes from 10.3.1.11: icmp_seq=1 ttl=64 time=0.428 ms
  64 bytes from 10.3.1.11: icmp_seq=2 ttl=64 time=0.897 ms
  64 bytes from 10.3.1.11: icmp_seq=3 ttl=64 time=0.864 ms
  64 bytes from 10.3.1.11: icmp_seq=4 ttl=64 time=0.926 ms
  ```

- Observer les tables ARP des deux machines

  ```sh
  # Machine 1
  $ ip r s
  10.3.1.0/24 dev enp0s8 proto kernel scope link src 10.3.1.11 metric 100
  ```

  ```sh
  # Machine 2
  $ ip r s
  10.3.1.0/24 dev enp0s8 proto kernel scope link src 10.3.1.12 metric 100
  ```

- Repérer l'adresse MAC de `jhon` dans la table arp de `marcel` et vice-versa

  - Adresse MAC de `jhon`(Machine 1) chez `marcel`(Machine 2)

    ```sh
    # Machine 2
    $ ip n s
    10.3.1.11 dev enp0s8 lladdr 08:00:27:59:55:7a STABLE
    ```

    On voit donc l'adresse MAC de `jhon`, on vérifie ça en faitsant un `ip a` chez `jhon`:

    ```sh
    # Machine 1
    $ ip a
    ...
    2: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> ...
    	link/ether 08:00:27:59:55:7a brd ff:ff:ff:ff:ff:ff
    	inet 10.3.1.11/24 brd 10.3.1.255 scope global noprefixroute enp0s8
    	...
    ```

    L'adresse MAC de `jhon` est donc bien `08:00:27:59:55:7a`

  - Adresse MAC de `marcel`(Machine 2) chez `jhon`(Machine 1)

    ```sh
    # Machine 1
    $ ip n s
    10.3.1.12 dev enp0s8 lladdr 08:00:27:56:22:ca STABLE
    ```

    On voit donc l'adresse MAC de `marcel`, on vérifie ça en faitsant un `ip a` chez `marcel`:

    ```sh
    # Machine 2
    $ ip a
    ...
    2: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> ...
    	link/ether 08:00:27:56:22:ca brd ff:ff:ff:ff:ff:ff
    	inet 10.3.1.12/24 brd 10.3.1.255 scope global noprefixroute enp0s8
    	...
    ```

    L'adresse MAC de `marcel` est donc bien `08:00:27:56:22:ca`

<br/>

### 2. Analyse de trames

🌞 Ananlyse de trames

- Vider les tables ARP des deux machines

  ```sh
  # Machine 1 & 2
  $ sudo ip n f all
  ```

  L'argument `f` correspond à `flush`

- Utiliser la commande `tcpdump` pour réaliser une capture trame
  Pour commencer, voici ce qui s'affiche lorsqu'on lance le `tcpdump`, avant toute réception de trame

  ```sh
  # Machine 1
  $ sudo tcpdump --interface enp0s8
  [...] device enp0s8 entered promiscuous mode
  dropped privs to tcpdump
  listening on enp0s8, link-type EN10MB (Ethernet), snapshot length 262144 bytes
  ```

- Effectuer un `ping`

  ```sh
  # Machine 2
  $ ping 10.3.1.11 -c 4

  PING 10.3.1.11 (10.3.1.11) 56(84) bytes of data.
  64 bytes from 10.3.1.11: icmp_seq=1 ttl=64 time=0.428 ms
  64 bytes from 10.3.1.11: icmp_seq=2 ttl=64 time=0.897 ms
  64 bytes from 10.3.1.11: icmp_seq=3 ttl=64 time=0.864 ms
  64 bytes from 10.3.1.11: icmp_seq=4 ttl=64 time=0.926 ms
  ```

  Et voici ce qu'on voit alors avec le `tcpdump`

  ```sh
  # Machine 1
  17:59:29.383673 IP 10.3.1.12 > localhost.localdomain: ICMP echo request, id 5, seq 1, length 64
  17:59:29.383673 IP localhost.localdomain > 10.3.1.12 : ICMP echo reply, id 5, seq 1, length 64
  ...
  8 packets captured
  8 packets received by filter
  8 packets dropped by kernel
  ```

🦈 **Capture réseau** `tp2_arp.pcapng` qui contient un ARP request et un ARP reply

## II. Routage

Vous aurez besoin de 3 VMs pour cette partie. **Réutilisez les deux VMs précédentes.**

| Machine  | `10.3.1.0/24` | `10.3.2.0/24` |
| -------- | ------------- | ------------- |
| `router` | `10.3.1.254`  | `10.3.2.254`  |
| `john`   | `10.3.1.11`   | no            |
| `marcel` | no            | `10.3.2.12`   |

> Je les appelés `marcel` et `john` PASKON EN A MAR des noms nuls en réseau 🌻

```schema
   john                router              marcel
  ┌─────┐             ┌─────┐             ┌─────┐
  │     │    ┌───┐    │     │    ┌───┐    │     │
  │     ├────┤ho1├────┤     ├────┤ho2├────┤     │
  └─────┘    └───┘    └─────┘    └───┘    └─────┘
```

### 1. Mise en place du routage

🌞**Activer le routage sur le noeud `router`**

> Cette étape est nécessaire car Rocky Linux c'est pas un OS dédié au routage par défaut. Ce n'est bien évidemment une opération qui n'est pas nécessaire sur un équipement routeur dédié comme du matériel Cisco.

```
[root@localhost ~]# echo 1 > /proc/sys/net/ipv4/ip_forward
```

🌞**Ajouter les routes statiques nécessaires pour que `john` et `marcel` puissent se `ping`**

- il faut ajouter une seule route des deux côtés
- une fois les routes en place, vérifiez avec un `ping` que les deux machines peuvent se joindre

```
[root@localhost ~]# route add default gw 10.3.1.254
[root@localhost ~]# netstat -rn
Kernel IP routing table
Destination     Gateway         Genmask         Flags   MSS Window  irtt Iface
0.0.0.0         10.3.1.254      0.0.0.0         UG        0 0          0 enp0s8
10.3.1.0        0.0.0.0         255.255.255.0   U         0 0          0 enp0s8
```

```
[root@localhost ~]# route add default gw 10.3.2.254
[root@localhost ~]# netstat -rn
Kernel IP routing table
Destination     Gateway         Genmask         Flags   MSS Window  irtt Iface
0.0.0.0         10.3.2.254      0.0.0.0         UG        0 0          0 enp0s8
10.3.2.0        0.0.0.0         255.255.255.0   U         0 0          0 enp0s8
```

```
[root@localhost ~]# ping 10.3.1.13
PING 10.3.1.13 (10.3.1.13) 56(84) bytes of data.
64 bytes from 10.3.1.13: icmp_seq=1 ttl=63 time=1.32 ms
64 bytes from 10.3.1.13: icmp_seq=2 ttl=63 time=1.30 ms
64 bytes from 10.3.1.13: icmp_seq=3 ttl=63 time=1.04 ms
^C
--- 10.3.1.13 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
rtt min/avg/max/mdev = 1.040/1.218/1.320/0.126 ms



[root@localhost ~]# ping 10.3.2.12
PING 10.3.2.12 (10.3.2.12) 56(84) bytes of data.
64 bytes from 10.3.2.12: icmp_seq=1 ttl=63 time=1.27 ms
64 bytes from 10.3.2.12: icmp_seq=2 ttl=63 time=1.19 ms
64 bytes from 10.3.2.12: icmp_seq=3 ttl=63 time=1.12 ms
^C
--- 10.3.2.12 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2005ms
rtt min/avg/max/mdev = 1.123/1.193/1.271/0.060 ms
```

### 2. Analyse de trames

🌞**Analyse des échanges ARP**

- videz les tables ARP des trois noeuds
- effectuez un `ping` de `john` vers `marcel`
- regardez les tables ARP des trois noeuds
- essayez de déduire un peu les échanges ARP qui ont eu lieu
- répétez l'opération précédente (vider les tables, puis `ping`), en lançant `tcpdump` sur `marcel`
- **écrivez, dans l'ordre, les échanges ARP qui ont eu lieu, puis le ping et le pong, je veux TOUTES les trames** utiles pour l'échange

Par exemple (copiez-collez ce tableau ce sera le plus simple) :

| ordre | type trame  | IP source | MAC source              | IP destination | MAC destination            |
| ----- | ----------- | --------- | ----------------------- | -------------- | -------------------------- |
| 1     | Requête ARP | x         | `john` `AA:BB:CC:DD:EE` | x              | Broadcast `FF:FF:FF:FF:FF` |
| 2     | Réponse ARP | x         | ?                       | x              | `john` `AA:BB:CC:DD:EE`    |
| ...   | ...         | ...       | ...                     |                |                            |
| ?     | Ping        | ?         | ?                       | ?              | ?                          |
| ?     | Pong        | ?         | ?                       | ?              | ?                          |

> Vous pourriez, par curiosité, lancer la capture sur `john` aussi, pour voir l'échange qu'il a effectué de son côté.

🦈 [**Capture réseau `tp2_routage_marcel.pcapng`**](./filesTP2/arp.pcapng)

### 3. Accès internet

🌞**Donnez un accès internet à vos machines**

- ajoutez une carte NAT en 3ème inteface sur le `router` pour qu'il ait un accès internet
- ajoutez une route par défaut à `john` et `marcel`
  - vérifiez que vous avez accès internet avec un `ping`
  - le `ping` doit être vers une IP, PAS un nom de domaine
- donnez leur aussi l'adresse d'un serveur DNS qu'ils peuvent utiliser
  - vérifiez que vous avez une résolution de noms qui fonctionne avec `dig`
  - puis avec un `ping` vers un nom de domaine

🌞**Analyse de trames**

- effectuez un `ping 8.8.8.8` depuis `john`
- capturez le ping depuis `john` avec `tcpdump`
- analysez un ping aller et le retour qui correspond et mettez dans un tableau :

| ordre | type trame | IP source          | MAC source              | IP destination | MAC destination |     |
| ----- | ---------- | ------------------ | ----------------------- | -------------- | --------------- | --- |
| 1     | ping       | `john` `10.3.1.12` | `john` `AA:BB:CC:DD:EE` | `8.8.8.8`      | ?               |     |
| 2     | pong       | ...                | ...                     | ...            | ...             | ... |

🦈 **Capture réseau `tp2_routage_internet.pcapng`**

## III. DHCP

On reprend la config précédente, et on ajoutera à la fin de cette partie une 4ème machine pour effectuer des tests.

| Machine  | `10.3.1.0/24`              | `10.3.2.0/24` |
| -------- | -------------------------- | ------------- |
| `router` | `10.3.1.254`               | `10.3.2.254`  |
| `john`   | `10.3.1.11`                | no            |
| `bob`    | oui mais pas d'IP statique | no            |
| `marcel` | no                         | `10.3.2.12`   |

```schema
   john               router              marcel
  ┌─────┐             ┌─────┐             ┌─────┐
  │     │    ┌───┐    │     │    ┌───┐    │     │
  │     ├────┤ho1├────┤     ├────┤ho2├────┤     │
  └─────┘    └─┬─┘    └─────┘    └───┘    └─────┘
   john        │
  ┌─────┐      │
  │     │      │
  │     ├──────┘
  └─────┘
```

### 1. Mise en place du serveur DHCP

🌞**Sur la machine `john`, vous installerez et configurerez un serveur DHCP** (go Google "rocky linux dhcp server").

- installation du serveur sur `john`
- créer une machine `bob`
- faites lui récupérer une IP en DHCP à l'aide de votre serveur

> Il est possible d'utilise la commande `dhclient` pour forcer à la main, depuis la ligne de commande, la demande d'une IP en DHCP, ou renouveler complètement l'échange DHCP (voir `dhclient -h` puis call me et/ou Google si besoin d'aide).

🌞**Améliorer la configuration du DHCP**

- ajoutez de la configuration à votre DHCP pour qu'il donne aux clients, en plus de leur IP :
  - une route par défaut
  - un serveur DNS à utiliser
- récupérez de nouveau une IP en DHCP sur `bob` pour tester :
  - `marcel` doit avoir une IP
    - vérifier avec une commande qu'il a récupéré son IP
    - vérifier qu'il peut `ping` sa passerelle
  - il doit avoir une route par défaut
    - vérifier la présence de la route avec une commande
    - vérifier que la route fonctionne avec un `ping` vers une IP
  - il doit connaître l'adresse d'un serveur DNS pour avoir de la résolution de noms
    - vérifier avec la commande `dig` que ça fonctionne
    - vérifier un `ping` vers un nom de domaine

### 2. Analyse de trames

🌞**Analyse de trames**

- lancer une capture à l'aide de `tcpdump` afin de capturer un échange DHCP
- demander une nouvelle IP afin de générer un échange DHCP
- exportez le fichier `.pcapng`

🦈 **Capture réseau `tp2_dhcp.pcapng`**

---

_Projet réalisé avec ROULLAND Roxanne et LAROUMANIE Gabriel_
(Parce que je n'avais plus d'ordi)
