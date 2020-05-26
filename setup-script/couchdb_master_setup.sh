#!/bin/bash
sudo mkdir /etc/systemd/system/docker.service.d
sudo cp http-proxy.conf /etc/systemd/system/docker.service.d/http-proxy.conf
sudo systemctl daemon-reload && sudo systemctl restart docker

export user=admin
export pass=croup41
export VERSION='3.0.0'
export cookie='a192aeb9904e6590849337933b000c99'
export masternode=172.26.130.63
export node=`hostname -I | awk '{print $1}'`

echo [pulling db]
sudo docker pull ibmcom/couchdb3:${VERSION}

echo [delete conflict server]
if [ ! -z $(docker ps --all --filter "name=couchdb_server" --quiet) ] 
then
  sudo docker stop $(docker ps --all --filter "name=couchdb_server" --quiet) 
  sudo docker rm $(docker ps --all --filter "name=couchdb_server" --quiet)
fi

echo [create volume]
sudo docker volume create couchdb-vol

echo [create server docker]
sudo docker create\
  -p 5984:5984 -p 4369:4369 -p 9100:9100\
  --name couchdb_server\
  --mount source=couchdb-vol,target=/opt/couchdb/data\
  --env COUCHDB_USER=${user}\
  --env COUCHDB_PASSWORD=${pass}\
  --env COUCHDB_SECRET=${cookie}\
  --env ERL_FLAGS="-setcookie \"${cookie}\" -name \"couchdb@${node}\""\
  ibmcom/couchdb3:${VERSION}

echo [start server docker]
sudo docker start couchdb_server

# export couchdb_ip=`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' couchdb_server`
sleep 5

echo [tset server]
curl -XGET "http://${user}:${pass}@${node}:5984/"

echo [modify vm.args]
sudo docker exec -ti -w /opt/couchdb/etc couchdb_server echo -name couchdb@${node} >> vm.args

echo [cluster server]
curl -XPOST "http://${user}:${pass}@${masternode}:5984/_cluster_setup" \
      --header "Content-Type: application/json"\
      --data "{\"action\": \"enable_cluster\", \"bind_address\":\"0.0.0.0\",\
             \"username\": \"${user}\", \"password\":\"${pass}\", \"port\": \"5984\",\
             \"remote_node\": \"${node}\", \"node_count\": \"3\",\
             \"remote_current_user\":\"${user}\", \"remote_current_password\":\"${pass}\"}"

sleep 2

echo [test _membership]
curl -X GET "http://${user}:${pass}@${node}:5984/_membership"