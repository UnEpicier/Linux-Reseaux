# TP3 : On va router des trucs

## Prérequis

Pour ce TP, nous aurons besoin de deux VM sous Rocky Linux.
<br/>
Les machines porteront un surnom chacun:

-   Machine 1: `jhon`
-   Machine 2: `marcel`

Les adresses IP seront définis à la main et précisées.

## I. ARP

Voici les IPs pour cette partie:

| Machine  | 10.3.1.0/24 |
| -------- | ----------- |
| `jhon`   | `10.3.1.11` |
| `marcel` | `10.3.1.12` |

### 1. Échange ARP

🌞 Générer des requêtes ARP

-   Effectuer un `ping` d'une machine à l'autre

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

-   Observer les tables ARP des deux machines

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

-   Repérer l'adresse MAC de `jhon` dans la table arp de `marcel` et vice-versa

    -   Adresse MAC de `jhon`(Machine 1) chez `marcel`(Machine 2)

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

    -   Adresse MAC de `marcel`(Machine 2) chez `jhon`(Machine 1)

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

-   Vider les tables ARP des deux machines

    ```sh
    # Machine 1 & 2
    $ sudo ip n f all
    ```

    L'argument `f` correspond à `flush`

-   Utiliser la commande `tcpdump` pour réaliser une capture trame
    Pour commencer, voici ce qui s'affiche lorsqu'on lance le `tcpdump`, avant toute réception de trame

    ```sh
    # Machine 1
    $ sudo tcpdump --interface enp0s8
    [...] device enp0s8 entered promiscuous mode
    dropped privs to tcpdump
    listening on enp0s8, link-type EN10MB (Ethernet), snapshot length 262144 bytes
    ```

-   Effectuer un `ping`

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
