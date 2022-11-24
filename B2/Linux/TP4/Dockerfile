FROM ubuntu

RUN apt update -y
RUN apt install -y apache2

RUN mkdir -p /var/www/html

ADD index.html /var/www/html/index.html
ADD index.css /var/www/html/index.css

ADD custom.conf /etc/apache2/apache2.conf

RUN mkdir -p /etc/apache2/logs
RUN chmod 755 /etc/apache2/logs

CMD ["apache2", "-D", "FOREGROUND"]