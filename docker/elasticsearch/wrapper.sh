#!/bin/bash

chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/data

su -c "/bin/bash bin/es-docker" elasticsearch
