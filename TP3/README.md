# TP 3 : A little script

- [TP 3 : A little script](#tp-3--a-little-script)
- [I. Script carte d'identité](#i-script-carte-didentité)

# I. Script carte d'identité

Nous avons écris **un script qui récolte des informations sur le système et les affiche à l'utilisateur.** Il s'appelle `idcard.sh` et est stocké dans `/srv/idcard/idcard.sh`.

> `.sh` est l'extension qu'on donne par convention aux scripts réalisés pour être exécutés avec `sh` ou `bash`.

Le script doit afficher :

- le nom de la machine
- le nom de l'OS de la machine
- la version du noyau Linux utilisé par la machine
- l'adresse IP de la machine
- l'état de la RAM
  - espace dispo en RAM (en Go, Mo, ou Ko)
  - taille totale de la RAM (en Go, Mo, ou ko)
- l'espace restant sur le disque dur, en Go (ou Mo, ou ko)
- le top 5 des processus qui pompent le plus de RAM sur la machine actuellement. Procédez par étape :
  - listez les process
  - affichez la RAM utilisée par chaque process
  - triez par RAM utilisée
  - isolez les 5 premiers
- la liste des ports en écoute sur la machine, avec le programme qui est derrière
- un lien vers une image/gif random de chat
  - il y a de très bons sites pour ça
  - avec [celui-ci](https://docs.thecatapi.com/), une simple commande `curl https://api.thecatapi.com/v1/images/search` nous retourne l'URL d'une random image de chat

Au final, le script doit retourner **exactement** cette structure :

```bash
$ /srv/idcard/idcard.sh
Machine name : ...
OS ... and kernel version is ...
IP : ...
RAM : ... RAM restante sur ... RAM totale
Disque : ... space left
Top 5 processes by RAM usage :
  - ...
  - ...
  - ...
  - ...
  - ...
Listening ports :
  - 22 : sshd
  - ...
  - ...

Here's your random cat : https://cdn2.thecatapi.com/images/ahb.jpg
```