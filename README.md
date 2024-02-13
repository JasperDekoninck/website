# Personal website

This repository contains the code for my personal website, available at [https://jasperdekoninck.eu.pythonanywhere.com/](https://jasperdekoninck.eu.pythonanywhere.com/). Note that this website contains outdated information about myself as I am not actively updating it. The sole purpose of this project was to learn Django, CSS and HTML and have some fun while doing so. It is quite a large project as such.

### Installation

If you want to install or use this code locally, install [Conda](https://docs.conda.io/projects/miniconda/en/latest/) and run the following:

```bash
sudo apt-get install mysql-server libmysqlclient-dev
conda create -n website python=3.11 -y
conda activate website
python -m pip install -r requirements.txt
```

We also need to initialize the database:

```bash
sudo mysql -u root
CREATE DATABASE mydb;
CREATE USER 'dbadmin'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON mydb.* TO 'dbadmin'@'localhost';
FLUSH PRIVILEGES;
```

Now we can initialize the Django project:

```bash
python manage.py migrate
python manage.py collectstatic
python manage.py createsuperuser
```
Note that the last command will guide you through the process of creating a superuser.

Now we can run the server:
```bash
python manage.py runserver
```

Note that the games and the news created and visible on the [website](https://jasperdekoninck.eu.pythonanywhere.com/) are not visible locally since we would need to add them manually into the database. You can add the games, random projects and math projects in the admin. The fields usually speak for themselves, although we note that the html page field should only be the basename, i.e. the html filename without any folder name in front of it.
