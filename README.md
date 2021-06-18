# ptzWeb

Pan Tilt GUI interface - Sends Pelco Commands to PTDriver via Unix Domain Socket at /tmp/motionSrv

The PTDriver binary needs to be executed first and be listening at /tmp/moitionSrv. 

In addition to the socket communication the app also monitors gyro data via shared memory and pid status. Because of this you need to run PTDriver and ptzWeb as root. The memory mapped files are located at:

	/dev/shm/gyro0
	/dev/shm/gyro1
	/dev/shm/pid_pan
	/dev/shm/pid_tlt

If the gyro is not present both PTDriver and ptzWeb should sidestep this feature and still run. There is support for a send gyro (/dev/shm/gyro1) in order support evaluating another gyro. 


# Install

Clone repo and then do 

	>npm install

# Synopsis

	>node ./src/ptzWeb.js

If PTDriver is already started then the app should connect to the /tmp/motionSrv socket

# Build 

If changes are made to ./src/static/js/ptz.js or ./src/static/js/plot.js these need to be broswerified via 

	>npm run bundlePtz
	>npm run bundlePlot

Which create ptz_bundle.js and plot_bundle.js which are referenced in the html

# Screenshot

![ptzWeb](/doc/ptzWeb.png)


# Yet ToDo

* Combined Homing button 
* Both Axis Steady button
