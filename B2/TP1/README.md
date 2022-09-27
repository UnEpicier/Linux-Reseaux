<h1 align="center" >TP1 : Mise en jambes</h1>

## Sommaire

## I. Exploration locale en solo

### 1. Affichage d'informations sur la pile TCP/IP locale

<br/>

#### **En CLI**

🌞 Affichez les infos des cartes réseau de votre PC

```sh
$ ip a | tail - 6

2: wlp2s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 18:47:3d:40:ed:a7 brd ff:ff:ff:ff:ff:ff
    inet 10.33.19.196/22 brd 10.33.19.255 scope global dynamic noprefixroute wlp2s0
       valid_lft 76539sec preferred_lft 76539sec
    inet6 fe80::4797:2966:8eb9:6c1e/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
```

- Le nom de l'interface est donc `wlp2s0` (ligne 1)
- Son adresse MAC est `18:47:3d:40:ed:a7` (ligne 3)
- Son adresse IP est `10.33.19.196/22` (ligne 4)

🌞 Affichez votre gateway

```sh
$ ip r
default via 10.33.19.254 dev wlp2s0 proto dhcp src 10.33.19.196 metric 600
10.33.16.0/22 dev wlp2s0 proto kernel scope link src 10.33.19.196 metric 600
```

La gateway est `10.33.19.254`
<br/>
<br/>

#### **En graphique**

🌞 Trouvez comment afficher les informations sur une carte IP (change selon l'OS)

![image](./1-GUI.png)

Donc dans les détails, l'adresse IP est noté en ligne 1,<br>
La passerelle en ligne 2<br/>
Et l'adresse MAC en avant-dernière ligne (ligne 11)
<br/>
<br/>

#### **Questions**

🌞 À quoi sert la gateway dans le réseau d'YNOV ?

La gateway sert à faire le lien entre les réseaux locaux et les réseaux internet.
<br/>
<br/>

### 2.Modifications des informations

#### A. Modification d'adresse IP (part 1)

<br/>
🌞 Utilisez l'interface graphique de votre OS pour changer d'adresse IP :

![image](./2-GUI.png)

Pour changer d'adresse IP graphiquement, il faut aller dans les paramètres de la connexion, passer la méthode d'automatique à manuelle, puis rentrer l'adresse IP, le masque de sous-réseau et la passerelle.

<br/>

🌞 Il est possible que vous perdiez l'accès internet. Pourquoi ?

Parce que l'adresse IP choisie peut être déjà utilisé par un autre ordinateur, ce qui empêche au routeur d'envoyer les requêtes à ce second ordinateur.
