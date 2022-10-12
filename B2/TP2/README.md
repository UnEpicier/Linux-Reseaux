# TP2 : Ethernet, IP, et ARP

# O. Prérequis

```bash
Choix de PC + VM
```

# 1. Setup IP

### - Mettez en place une configuration réseau fonctionnelle entre les deux machines

```bash
# changement d'adresse IP sur la VM
roxanne@roxanne-VirtualBox:/etc$ sudo nano netplan/01-network-manager-all.yaml
[sudo] password for roxanne:
roxanne@roxanne-VirtualBox:~$ cat /etc/netplan/01-network-manager-all.yaml
# Let NetworkManager manage all devices on this system
network:
  version: 2
  renderer: NetworkManager
  ethernets:
    enp0s8:
      dhcp4: no
      addresses:
        - 192.168.121.4/26
      nameservers:
          addresses: [8.8.8.8, 1.1.1.1]


# adresse IP choisie pour la VM

192.168.121.4/26

# adresse IP choisie pour le PC

192.168.121.6/26

# le masque de sous-réseau

255.255.255.192
```

### - Prouvez que la connexion est fonctionnelle entre les deux machines

```bash
PS C:\Users\33785> ping 192.168.121.4

Envoi d’une requête 'Ping'  192.168.121.4 avec 32 octets de données :
Réponse de 192.168.121.4 : octets=32 temps<1ms TTL=64
Réponse de 192.168.121.4 : octets=32 temps=1 ms TTL=64
Réponse de 192.168.121.4 : octets=32 temps=1 ms TTL=64
Réponse de 192.168.121.4 : octets=32 temps<1ms TTL=64

Statistiques Ping pour 192.168.121.4:
    Paquets : envoyés = 4, reçus = 4, perdus = 0 (perte 0%),
Durée approximative des boucles en millisecondes :
    Minimum = 0ms, Maximum = 1ms, Moyenne = 0ms
```

### - Wireshark it

```bash
# les paquets ICMP envoyés sont des paquets de type 8 (request / ping) et de type 0 (reply / pong)
```

[PCAP des paquets ICMP](./files/ping1.pcapng)

# II - ARP my bro

```bash
# affichage de la MAC de mon binome
PS C:\Users\33785> arp -a

[...]

Interface : 192.168.121.6 --- 0xb
  Adresse Internet      Adresse physique      Type
  192.168.121.4         08-00-27-c4-3e-ec     dynamique
  [...]
```

```bash
# affichage de la MAC de ma gateway

PS C:\Users\33785> arp -a

[...]

Interface : 192.168.43.114 --- 0x14
  Adresse Internet      Adresse physique      Type
  192.168.43.1          f2-fd-c6-a8-2c-97     dynamique
[...]
```

### - Manipuler la table ARP

```bash
# suppression des données de la table ARP
PS C:\Windows\system32> arp -d

# affichage des modifications
PS C:\Windows\system32> arp -a

Interface : 10.5.1.1 --- 0x5
  Adresse Internet      Adresse physique      Type
  224.0.0.22            01-00-5e-00-00-16     statique

Interface : 192.168.121.6 --- 0xb
  Adresse Internet      Adresse physique      Type
  224.0.0.22            01-00-5e-00-00-16     statique

Interface : 192.168.43.114 --- 0x14
  Adresse Internet      Adresse physique      Type
  224.0.0.22            01-00-5e-00-00-16     statique


# affichage de la table ARP après deux pings vers ma VM et ma gateway
PS C:\Windows\system32> arp -a

Interface : 10.5.1.1 --- 0x5
  Adresse Internet      Adresse physique      Type
  224.0.0.22            01-00-5e-00-00-16     statique
  239.255.255.250       01-00-5e-7f-ff-fa     statique

Interface : 192.168.121.6 --- 0xb
  Adresse Internet      Adresse physique      Type
  192.168.121.4         08-00-27-c4-3e-ec     dynamique
  224.0.0.22            01-00-5e-00-00-16     statique
  239.255.255.250       01-00-5e-7f-ff-fa     statique

Interface : 192.168.43.114 --- 0x14
  Adresse Internet      Adresse physique      Type
  192.168.43.1          f2-fd-c6-a8-2c-97     dynamique
  224.0.0.22            01-00-5e-00-00-16     statique
  239.255.255.250       01-00-5e-7f-ff-fa     statique
```

### - Wireshark it

```bash
# pour les lignes 9 et 10, l'adresse source est 192.168.121.6 et l'adresse de destination est 192.168.121.4
# pour les lignes 11 et 12, l'adresse source est 192.168.121.4 et l'adresse de destination est 192.168.121.6
```

[Trame ARP](./files/arp1.pcapng)

# II.5. Interlude Hackerzz

```bash
# Lu :)
```

# III - DHCP you too my brooo

### - Wireshark it

```bash
# La première trame est la Discover, le pc n'a pas d'adresse et envoie une requête au broadcast

# La deuxième trame est la Offer, c'est la gateway qui envoie une requête à l'ordinateur en lui proposant une adresse ip et en lui indiquant le temps qu'il peut l'utiliser

# La troisème trame est la Request, le client prévient le serveur qu'il est prêt à accepter l'adresse IP

# La dernière trame est la ACK (Acknowledge), le serveur indique au client que l'adresse IP lui a bien été assignée

```

[Echange DORA](./files/dhcp.pcapng)

# IV. Avant-goût TCP et UDP

### - Wireshark it

[Trame ARP](./files/arp1.pcapng)

---

_Projet réalisé avec ROULLAND Roxanne et LAROUMANIE Gabriel_
(Parce que je n'avais plus d'ordi)
