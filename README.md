# TP1 : Are you dead yet ?

Ce premier TP a pour objectif de détruire des machines sous Linux.

---

**Le but va être de péter la machine virtuelle.**

Peu importe comment, faut la péteeeeer.

Par "péter" on entend la rendre inutilisable. Ca peut être strictement inutilisable, ou des trucs un peu plus légers, **soyons créatifs**.

➜ Si la machine boot même plus, c'est valide.  
➜ Si la machine boot mais qu'on peut rien faire du tout, c'est valide.  
➜ Si la machine boot, qu'on peut faire des trucs mais que pendant 15 secondes après c'est mort, c'est valide.  
➜ Si ça boot étou, mais que c'est VRAIMENT CHIANT d'utiliser la machine, c'est VALIDE.  

**Bref si on peut pas utiliser la machine normalement, c'est VA-LI-DE.**  

---

🌞 **Trouver au moins 5 façons différentes de péter la machine**

- ###ON SUPPRIME TOUT
Le but de cette première destruction est de tout supprimer, absolument tout ce qu'on peut (en étant administrateur).
Pour cela, on fait dans un shell:
```sh
sudo rm -rf /
```
On utilise donc le sudo pour passer en administrateur, et on supprime tout de manière récursif `-r`: Chaques sous dossiers/fichiers etc... et en forçant avec le `-f` à la racine donc `/`.
Ce qui a donc pour effet de ne plus pouvoir démarrer puisqu'il n'y a plus de boot ou autre, il ne reste que le BIOS ou UEFI.

- ###On supprime le home
Ici on va supprimer uniquement le /home qui est le répertoire où ce trouve notamment le dossier Documents, Images ainsi que Desktop, pour cela on fait:
```sh
sudo rm -d  -rf /home && sudo reboot
```
L'effet de celle-ci est qu'après exécution, on supprime le dossier /home, mais tant qu'on est connecté, la machine reste entre autre utilisable, donc pour y "remédier", on redémarre la machine. Lorsqu'on arrive à l'écran de connexion, à quoi bon mettre son bon mot de passe puisque la machine nous redemendera de nous connecter indéfiniement n'ayant pas trouvé le dossier /home.

- ### Passwd
La commande pour cette destruction est:
```sh
sudo chmod 777 /etc/passwd && echo "" > /etc/passwd
```
Cette commande donne dans un premier temps toute permission au fichier passwd dans /etc/. Ensuite avec un echo null (d'où les deux guillements sans contenu) et l'utilisation du `> /etc/passwd` on remplace tout le contenu du fichier par "" donc strictement rien.
Ce fichier permet l'authentification des différents utilisateurs de la machine et également le root. S'il n'existe plus, alors la machine ne peut plus rien faire et par conséquent, l'utilisateur non plus.

- ### Packages
Celle-ci est un peut plus complexe puisque nous allons utiliser python.
La commande est la suivante:
```sh
sudo apt install python3 && cd ~/Desktop/ && echo $'#!/usr/bin/python3\nimport apt\ncache = apt.cache.Cache()\nfor package in cache:\n\tif (package.is_installed):\n\t\tprint(package.name, end=" ")\nprint' > run.py && sudo chmod 777 run.py && python3 run.py | sudo xargs apt-get remove -y --allow-remove-essential && sudo reboot
```
C'est un peut long mais on va y arriver x)
Dans un premier temps, on installe Python3 au cas où la machine ne l'aurais pas. Ensuite on se dirige sur le Bureau et faisons un echo en utilisant `> run.py` pour dire que la sortie standart soit redirigée vers un fichier appelé run.py. On utilise &'...' afin d'utiliser les \n et \t. Ce petit code permet de récupérer tout les packages installés (ceux qui servent à la machine également) et de les affichés ligne par ligne.
Ensuite on donne tout les accès (777) à ce même fichier puisque de base la machine à peut des exécutables (dommage pour elle on en fait un).
Et enfin (on touche au but), on lance ce petit fichier avec python (logique) et à l'aide d'une pipe on dit que pour chaque ligne qui est affiché, on la récupère et éxecute avec une commande `apt-get remove` pour supprimer chacun d'eux. On utilise -y pour éviter qu'il demande confirmation de suppression ainsi que --allow-remove-essential qui permet de bypass la sécurité comme quoi le package que l'on souhaite supprimer est un package utilisé par le système.
Pour voir ses effets tout à fait positifs sur la machine, on fait un reboot. Quand celle-ci redémarre, elle cherchera à lancer ses packages mais sans succès, ce qui la fera recommencer à l'infinie.

- ### Fork Bomb
Voici la commande:
```sh
:(){ :|: & };:
```
Cette commande permet de créer une fonction de terminal qui se duplique elle-même sans fin. Ce qui finis par occuper une grande place dans le CPU ainsi que la RAM, faisant petit à petit devenir l'utilisation de la machine quasi impossible.
Tout simplement.
