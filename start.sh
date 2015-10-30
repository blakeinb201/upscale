#!/bin/bash -e

# set permissions
# chmod 755 start.sh

# create new cron job
# crontab -e
# @reboot /home/upscale/start.sh

#start the app
app=$HOME/upscale
cd $app && DEBUG=app npm start