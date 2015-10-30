#!/bin/bash -e

# set permissions
# chmod 755 start.sh

# npm install -g forever
#
# create new cron job
# crontab -e
# @reboot /home/upscale/start.sh

#start the app
app=$HOME/upscale
cd $app && forever start bin/www