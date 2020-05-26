#!/bin/bash
. ./openrc.sh; ansible-playbook -i hosts -u ubuntu --key-file=~/.ssh/assignment2 nectar2.yaml