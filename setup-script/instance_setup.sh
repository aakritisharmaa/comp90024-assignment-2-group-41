sudo rm /var/lib/apt/lists/lock
sudo rm /var/cache/apt/archives/lock
sudo rm /var/lib/dpkg/lock*

sudo dpkg --configure -a

sudo apt-get update
sudo apt-get inatall --yes python3-pip
sudo apt-get inatall --yes npm

sudo apt-get install --yes docker
sudo apt-get install --yes docker.io
sudo curl -L "https://github.com/docker/compose/releases/download/1.25.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo apt-get install -y node-grunt-cli

sudo apt-get install -y jq

sudo apt-get install -y qgis

sudo apt-get install -y git
git clone https://github.com/AURIN/comp90024.git

npm install ./comp90024
