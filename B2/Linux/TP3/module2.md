# Module 2: Réplication de base de données

## Setup

Après avoir créer notre serveur de réplication, on fait l'install classique d'un serveur MariaDB

```sh
[unepicier@replication ~]$ sudo dnf install mariadb-server -y
Complete!

[unepicier@replication ~]$ sudo systemctl start mariadb
[unepicier@replication ~]$ sudo systemctl enable mariadb

[unepicier@replication ~]$ sudo mysql_secure_installation
Thanks for using MariaDB!
```

## Master node

Le master node est note db déjà en place, la db principale, on la prépare donc à utiliser notre serveur de réplication

Donc dans un premier temps, on active les log binaires

```sql
SET sql_log_bin=1;
Query OK, 0 rows affected (0.011 sec)
```

On édit la conf

```sh
[unepicier@db ~]$ sudo vim /etc/my.cnf
[unepicier@db ~]$ cat /etc/my.cnf
#
# This group is read both both by the client and the server
# use it for options that affect everything
#
[client-server]

#
# include all files from the config directory
#
!includedir /etc/my.cnf.d

[mariadb]
log-bin
server_id=1
log-basename=master1
binlog-format=mixed
bind-address=0.0.0.0
skip-networking=0

# On restart
[unepicier@db ~]$ sudo systemctl restart mariadb
```

Puis on créer le user slave sur le master

```sql
MariaDB [(none)]> CREATE USER 'replication'@'%' IDENTIFIED BY 'replication';
Query OK, 0 rows affected (0.006 sec)

MariaDB [(none)]> GRANT REPLICATION SLAVE ON *.* TO 'replication'@'%';
Query OK, 0 rows affected (0.001 sec)

MariaDB [(none)]> FLUSH PRIVILEGES;
```

Pour plus tard, on a également besoin d'une autre commande qui nous donne le nom du fichier binaire et sa position

```sql
MariaDB [(none)]> SHOW MASTER STATUS
    -> ;
+--------------------+----------+--------------+------------------+
| File               | Position | Binlog_Do_DB | Binlog_Ignore_DB |
+--------------------+----------+--------------+------------------+
| master1-bin.000001 |      794 |              |                  |
+--------------------+----------+--------------+------------------+
1 row in set (0.000 sec)
```

## Slave Node

Maintenant on va sur la machine slave et on commence par edit la conf

```sh
[unepicier@replication ~]$ sudo vim /etc/my.cnf
[unepicier@replication ~]$ cat /etc/my.cnf
#
# This group is read both both by the client and the server
# use it for options that affect everything
#
[client-server]

#
# include all files from the config directory
#
!includedir /etc/my.cnf.d

[mariadb]
log-bin
server-id=2
log-basename=slave1
binlog-format=mixed
bind-address=0.0.0.0
skip-networking=0

# On restart
[unepicier@replication ~]$ sudo systemctl restart mariadb
```

Maintenant on va se connecter à la db pour déclarer que ce serveur est un slave, et qu'on le connecte au master

```sql
MariaDB [(none)]> STOP SLAVE;
Query OK, 0 rows affected, 1 warning (0.000 sec)

MariaDB [(none)]> CHANGE MASTER TO MASTER_HOST = '10.102.1.12', MASTER_USER = 'replication', MASTER_PASSWORD = 'replication', MASTER_LOG_FILE = 'master1-bin.000001', MASTER_LOG_POS = 794;
Query OK, 0 rows affected (0.008 sec)

MariaDB [(none)]> START SLAVE;
Query OK, 0 rows affected (0.001 sec)
```

## Verifications

Donc normalement, tout roule mais on va le vérifie

Sur la machine master, on va créer (juste pour tester) une nouvelle db et y ajouter un peu de contenu

```sql
MariaDB [(none)]> CREATE DATABASE test_rep;
Query OK, 1 row affected (0.000 sec)

MariaDB [(none)]> USE test_rep;
Database changed
MariaDB [test_rep]> CREATE TABLE test (id int, name varchar(20));
Query OK, 0 rows affected (0.016 sec)

MariaDB [test_rep]> INSERT INTO test VALUES (1, "toto");
Query OK, 1 row affected (0.010 sec)

MariaDB [test_rep]> INSERT INTO test VALUES (2, "tata");
Query OK, 1 row affected (0.001 sec)

MariaDB [test_rep]> SELECT * FROM test;
+------+------+
| id   | name |
+------+------+
|    1 | toto |
|    2 | tata |
+------+------+
2 rows in set (0.000 sec)
```

Et maintenant, on regarde sur le slave s'il a bien la même chose

```sql
MariaDB [(none)]> SHOW SLAVE STATUS \G
*************************** 1. row ***************************
                Slave_IO_State: Waiting for master to send event
                   Master_Host: 10.102.1.12
                   Master_User: replication
                   Master_Port: 3306
                 Connect_Retry: 60
               Master_Log_File: master1-bin.000001
           Read_Master_Log_Pos: 2424
                Relay_Log_File: slave1-relay-bin.000002
                 Relay_Log_Pos: 2187
         Relay_Master_Log_File: master1-bin.000001
              Slave_IO_Running: Yes
             Slave_SQL_Running: Yes
               Replicate_Do_DB:
           Replicate_Ignore_DB:
            Replicate_Do_Table:
        Replicate_Ignore_Table:
       Replicate_Wild_Do_Table:
   Replicate_Wild_Ignore_Table:
                    Last_Errno: 0
                    Last_Error:
                  Skip_Counter: 0
           Exec_Master_Log_Pos: 2424
               Relay_Log_Space: 2497
               Until_Condition: None
                Until_Log_File:
                 Until_Log_Pos: 0
            Master_SSL_Allowed: No
            Master_SSL_CA_File:
            Master_SSL_CA_Path:
               Master_SSL_Cert:
             Master_SSL_Cipher:
                Master_SSL_Key:
         Seconds_Behind_Master: 0
 Master_SSL_Verify_Server_Cert: No
                 Last_IO_Errno: 0
                 Last_IO_Error:
                Last_SQL_Errno: 0
                Last_SQL_Error:
   Replicate_Ignore_Server_Ids:
              Master_Server_Id: 1
                Master_SSL_Crl:
            Master_SSL_Crlpath:
                    Using_Gtid: No
                   Gtid_IO_Pos:
       Replicate_Do_Domain_Ids:
   Replicate_Ignore_Domain_Ids:
                 Parallel_Mode: optimistic
                     SQL_Delay: 0
           SQL_Remaining_Delay: NULL
       Slave_SQL_Running_State: Slave has read all relay log; waiting for more updates
              Slave_DDL_Groups: 2
Slave_Non_Transactional_Groups: 0
    Slave_Transactional_Groups: 2
1 row in set (0.000 sec)

MariaDB [(none)]> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| test_rep           |
+--------------------+
4 rows in set (0.000 sec)

MariaDB [(none)]> USE test_rep;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
MariaDB [test_rep]> SHOW TABLES;
+--------------------+
| Tables_in_test_rep |
+--------------------+
| test               |
+--------------------+
1 row in set (0.000 sec)

MariaDB [test_rep]> SELECT * FROM test;
+------+------+
| id   | name |
+------+------+
|    1 | toto |
|    2 | tata |
+------+------+
2 rows in set (0.000 sec)
```

ET BAM !!!

## Bonus 1 : Restriction de connexion

On souhaite que le user créé pour la réplication ne soit accessible que par le slave, pour cela, on doit éditer la partie contenant pour l'instant un `%` qui signifie qu'on autorise la connexion venant de n'importe quelle IP par l'adresse IP du serveur slave

```sql
MariaDB [(none)]> RENAME USER 'replication'@'%' TO 'replication'@'10.102.1.14';
Query OK, 0 rows affected (0.014 sec)
```

Voilà, maintenant plus qu'à tester, et on peut le faire localement (sur la machine master) puisque même le master ne peut plus s'y connecter

```sh
[unepicier@db ~]$ mysql -u replication -p
Enter password:
ERROR 1045 (28000): Access denied for user 'replication'@'localhost' (using password: YES)
```

Et voilà !

# Bonus 2 : Aucun slaves, que des masters

Pour cela, on va devoir remodifier notre config sur les deux machines (étant donné que la conf est maintenant presque la même (seuls les noms et id changent) je ne le montre qu'une fois)

```sh
[unepicier@db ~]$ sudo vim /etc/my.cnf
[unepicier@db ~]$ cat /etc/my.cnf
...
[mariadb]
log-bin
server_id=1
report_host=master # On ajoute juste ça
log-basename=master1
binlog-format=mixed
bind-address=0.0.0.0
skip-networking=0

# On restart
[unepicier@db ~]$ sudo systemctl restart mariadb

# On va modifier le user de replication:
[unepicier@db ~]$ mysql -u root -p

MariaDB [(none)]> RENAME USER 'replication'@'10.102.1.14' TO 'master1'@'10.102.1.14';
Query OK, 0 rows affected (0.008 sec)

# Comme tout à l'heure, on le garde pour après
MariaDB [(none)]> SHOW MASTER STATUS;
+--------------------+----------+--------------+------------------+
| File               | Position | Binlog_Do_DB | Binlog_Ignore_DB |
+--------------------+----------+--------------+------------------+
| master1-bin.000003 |      563 |              |                  |
+--------------------+----------+--------------+------------------+
1 row in set (0.000 sec)
```

Maintenant, on passe sur l'ancien slave

```sh
[unepicier@replication ~]$ sudo vim /etc/my.cnf
[unepicier@replication ~]$ cat /etc/my.cnf
...
[mariadb]
log-bin
server-id=2
report_host=master2 # On ajoute juste ça
log-basename=slave1 # Ici j'ai préféré ne pas changer pour pas que ça plante on sait jamais
binlog-format=mixed
bind-address=0.0.0.0
skip-networking=0

[unepicier@replication ~]$ sudo systemctl restart mariadb
```

Et on créer un autre utilisateur ici aussi

```sh
[unepicier@replication ~]$ mysql -u root -p

MariaDB [(none)]> CREATE USER 'master2'@'10.102.1.12' IDENTIFIED BY 'replication';
Query OK, 0 rows affected (0.001 sec)

MariaDB [(none)]> GRANT REPLICATION SLAVE ON *.* TO 'master2'@'10.102.1.12';
Query OK, 0 rows affected (0.011 sec)

# Encore une fois on le garde de côté
MariaDB [(none)]> SHOW MASTER STATUS;
+-------------------+----------+--------------+------------------+
| File              | Position | Binlog_Do_DB | Binlog_Ignore_DB |
+-------------------+----------+--------------+------------------+
| slave1-bin.000002 |     1159 |              |                  |
+-------------------+----------+--------------+------------------+
1 row in set (0.000 sec)
```

Et maintenant on les connectes !

Ci-dessous les commandes sql effectuées sur master2 mais sont les mêmes sur master1

```sql
MariaDB [(none)]> STOP SLAVE;
Query OK, 0 rows affected, 1 warning (0.000 sec)

MariaDB [(none)]> CHANGE MASTER TO MASTER_HOST='10.102.1.12', MASTER_USER='master1', MASTER_PASSWORD='r
eplication', MASTER_LOG_FILE='master1-bin.000003', MASTER_LOG_POS=563;
Query OK, 0 rows affected (0.013 sec)

MariaDB [(none)]> START SLAVE;
Query OK, 0 rows affected (0.001 sec)

MariaDB [(none)]> SHOW SLAVE STATUS \G
*************************** 1. row ***************************
                Slave_IO_State: Waiting for master to send event
                   Master_Host: 10.102.1.12
                   Master_User: master1
                   Master_Port: 3306
                 Connect_Retry: 60
               Master_Log_File: master1-bin.000003
           Read_Master_Log_Pos: 563
                Relay_Log_File: slave1-relay-bin.000002
                 Relay_Log_Pos: 557
         Relay_Master_Log_File: master1-bin.000003
              Slave_IO_Running: Yes
             Slave_SQL_Running: Yes
               Replicate_Do_DB:
           Replicate_Ignore_DB:
            Replicate_Do_Table:
        Replicate_Ignore_Table:
       Replicate_Wild_Do_Table:
   Replicate_Wild_Ignore_Table:
                    Last_Errno: 0
                    Last_Error:
                  Skip_Counter: 0
           Exec_Master_Log_Pos: 563
               Relay_Log_Space: 867
               Until_Condition: None
                Until_Log_File:
                 Until_Log_Pos: 0
            Master_SSL_Allowed: No
            Master_SSL_CA_File:
            Master_SSL_CA_Path:
               Master_SSL_Cert:
             Master_SSL_Cipher:
                Master_SSL_Key:
         Seconds_Behind_Master: 0
 Master_SSL_Verify_Server_Cert: No
                 Last_IO_Errno: 0
                 Last_IO_Error:
                Last_SQL_Errno: 0
                Last_SQL_Error:
   Replicate_Ignore_Server_Ids:
              Master_Server_Id: 1
                Master_SSL_Crl:
            Master_SSL_Crlpath:
                    Using_Gtid: No
                   Gtid_IO_Pos:
       Replicate_Do_Domain_Ids:
   Replicate_Ignore_Domain_Ids:
                 Parallel_Mode: optimistic
                     SQL_Delay: 0
           SQL_Remaining_Delay: NULL
       Slave_SQL_Running_State: Slave has read all relay log; waiting for more updates
              Slave_DDL_Groups: 1
Slave_Non_Transactional_Groups: 0
    Slave_Transactional_Groups: 0
1 row in set (0.000 sec)
```

Tout devrais être bon, plus qu'à vérifier

Sur master1

```sql
MariaDB [(none)]> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| nextcloud          |
| performance_schema |
| test_rep           |
+--------------------+
5 rows in set (0.003 sec)

MariaDB [(none)]> DROP DATABASE test_rep;
Query OK, 1 row affected (0.004 sec)
```

Sur master2

```sql
MariaDB [(none)]> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
+--------------------+
3 rows in set (0.000 sec)

MariaDB [(none)]> CREATE DATABASE rep_test;
Query OK, 1 row affected (0.000 sec)
```

Et sur master1

```sql
MariaDB [(none)]> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| nextcloud          |
| performance_schema |
| rep_test           |
+--------------------+
5 rows in set (0.000 sec)
```

Donc ça marche bel et bien !
Cependant petit détail, on peut voir que master2 n'a toujours pas la db de nextcloud.
Après avoir un peu cherché, il se trouve qu'il fallait que les deux schémas soit identiques, oui lorsqu'on créer une db l'autre l'as créée mais si une db existe déjà, l'autre va vouloir effectuer une opération dans une table / db qu'il n'as pas.
Donc je pense qu'il faut comme reset l'install coté DB de nextcloud pour avoir une réplication fonctionnelle.
