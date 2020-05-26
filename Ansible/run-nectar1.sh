#!/bin/bash

##. ./openrc.sh; ansible-playbook -i hosts --ask-become-pass nectar.yaml
. ./openrc.sh; ansible-playbook --ask-become-pass nectar1.yaml