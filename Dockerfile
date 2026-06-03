FROM php:8.2-apache

# PostgreSQL PDO extension
RUN apt-get update \
 && apt-get install -y --no-install-recommends libpq-dev \
 && docker-php-ext-install pdo pdo_pgsql \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable mod_rewrite (admin panel routing)
RUN a2enmod rewrite

# PHP production settings
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini

# Apache virtual host
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

# Copy app
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
