#!/bin/bash

# copy source files to js lib directory
echo -e "deploying files...\n"
# cp graphityrv4.js d3.v4.min.js d3-tip.js skater.js jsbld.js jsbld graphityr ~
cp ~/localgraphitysrc/* ~/.

# make it executable
chmod +x jsbld

# make graphityr executable if not already
chmod +x graphityr

echo -e "graphityr --help:\n"
./graphityr --help

# create a test
echo -e "building a test graphity...\n"
# cip=$(ifconfig | sed -En 's/127.0.0.1//;s/.*inet (addr:)?(([0-9]*\.){3}[0-9]*).*/\2/p') # get local ip address
./graphityr -fi ts_test.csv --rb --stat > ~/test.html


