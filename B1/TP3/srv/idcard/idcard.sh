#!/bin/bash
[ "$UID" -eq 0 ] || exec sudo bash "$0" "$@"
echo "Machine name : $(uname -n)"
echo "OS $(hostnamectl | grep "Operating System:" | cut -d ' ' -f3-) and kernel version is $(uname -r)"
echo "IP : $(ip -o route get to 8.8.8.8 | sed -n 's/.*src \([0-9.]\+\).*/\1/p')"
echo "RAM : $(bc <<< "scale=2; $(sed -n '/^MemFree:/ s/[^[:digit:]]//gp' /proc/meminfo) / 1024 / 1024 ")Go/$(bc <<< "scale=2; $(sed -n '/^MemTotal:/ s/[^[:digit:]]//gp' /proc/meminfo) / 1024 / 1024 ")Go"
echo "Disque : $(df -Pk -BG / | sed 1d | grep -v used | awk '{ print $4 }') left"
echo "Top 5 processes by RAM usage :"
ps aux | sort -rn -k 5,6 | head -n5 | while read line || [[ -n $line ]];
do
    echo $line | awk '{print " - " $1 " " $2 " " $3 " " $4 " " $5 " " $6 " " $7 " " $8 " " $9 " " $10 " " $11}'
done
echo "Listening ports :"
sudo ss -atlpn | grep LISTEN | while read line || [[ -n $line ]];
do
    port=$(echo $line | awk '{print $4}' | rev | cut -d ':' -f1 | rev)
    name=$(echo $line | awk '{print $6}' | cut -d '"' -f2)
    echo " - ${port} : ${name}"
done
echo "Here's your random cat : $(curl -s https://api.thecatapi.com/v1/images/search | cut -d ':' -f4-5 | cut -d ',' -f1 | cut -d '"' -f2)"