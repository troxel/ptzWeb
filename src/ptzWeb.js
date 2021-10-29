const fs = require('fs')
const path = require('path')

//const { TIMEOUT } = require('dns');
const express = require('express')
const app = express()

const expressWs = require('express-ws')
expressWs(app)
var WS_Pelco, WS_Data

const port = 3000

//console.log('begin')
setTimeout(()=>{ console.log('send'),10000})
//console.log('done')

app.set('view engine', 'pug')
app.set('views','./src/views');

console.log(path.join(__dirname,'/static'))
app.use(express.static(path.join(__dirname,'/static')))
//app.use(express.static('./src/static'))

app.locals.pretty = true;

// -----------------------------------
// -------- socket to MotionSrv ------
// -----------------------------------
var net = require('net')
const util = require('util')

var socket_path = "/tmp/motionSrv"

var sockclt = net.createConnection(socket_path)
 
sockclt.on('connect', ()=>{
  console.log("Connected to motionsrv!");
})
       
sockclt.on('data', function(data) {

  console.log("Yeah got data from motionSrv ",data)
  WS_Pelco.send(data) // Send to browser

})  
  
sockclt.on('error', function(err) {
  console.error('Server not active.',err); 

})

sockclt.on('close', function(err) {
  console.error('Socket closed ',err)

  console.log("Try Reconnecting")

  sockclt = net.createConnection(socket_path)

  siId = setInterval(function(){
    sockclt = net.connect(socket_path)
    console.log(sockclt)
   },7000)

   sockclt.on('connect', ()=>{
    console.log("Connected again to motionsrv!");
    clearInterval(siID)
  })
       

})

// -----------------------------------
// -------- Gyro Data          ------
// -----------------------------------
//mmap = require("@raygun-nickj/mmap-io")  // not sure why i used this version before
mmap = require("mmap-io")  

// ----------------------------------------------
//var sprintf = require('sprintf-js').sprintf
var shmFile = ["/dev/shm/gyro0","/dev/shm/gyro1"]
var shmBuffer = new Array();

for ( fname of shmFile ) {

  if( fs.existsSync(fname) ) {
    console.log("File exists ",fname)
    let fd = fs.openSync(fname, "r")
    let bsize = fs.fstatSync(fd)['size']

    let mbuffer = mmap.map(bsize, mmap.PROT_READ | mmap.PROT_EXECUTE, mmap.MAP_SHARED, fd)
    if ( mbuffer.length == bsize) { 
      shmBuffer.push(mbuffer) 
      console.log("mapped ", fname)
    }
  }
  else {
    console.log("File does not exist ",fname)
  }
}

// ----------------------------------------------
var shmPidFile = ["/dev/shm/pid_tlt","/dev/shm/pid_pan"]
var shmPidBuffer = new Array();

for ( fname of shmPidFile ) {

  if( fs.existsSync(fname) ) {
    console.log("File exists ",fname)
    let fd = fs.openSync(fname, "r")
    let bsize = fs.fstatSync(fd)['size']

    let mbuffer = mmap.map(bsize, mmap.PROT_READ | mmap.PROT_EXECUTE, mmap.MAP_SHARED, fd)
    if ( mbuffer.length == bsize) { 
      shmPidBuffer.push(mbuffer) 
      console.log("mapped ", fname)
    }
  }
  else {
    console.log("File does not exist ",fname)
  }
}

// -----------------------------------
// --------- Routes
// -----------------------------------
app.get('/', (req, res) => {
   res.render('index', { title: 'PTZ Control', active_home:"active" })  
})


// -------------------------------
app.ws('/cmd', function(ws, req) {
  
  WS_Pelco = ws   // save to global so use in event of receiving data from motionSrv

  ws.on('message', function(buffer) {

    console.log("/cmd",buffer);
    sockclt.write(buffer)

  });
  console.log('----------- / cmd ready ---------')
  
  ws.on('close', () => {
    console.log('WebSocket was closed')
  })
});

// -------------------------------
app.ws('/data', function(ws, req) {
  
  // websocket connection point... 

  WS_Data = ws   // save to global to use for sending gyro data... 
  console.log('----------- / data ready ---------')

  var intervalId

  ws.on('message', function(gyro_cmd) {

    console.log("/data gyro_cmd -> ",gyro_cmd);
    if ( gyro_cmd == 'start_plot_compare' ){

      var buffer2 = Buffer.alloc(shmBuffer[0].byteLength + shmBuffer[1].byteLength)
      
      intervalId = setInterval(()=>{ 

        //console.log(shmBuffer)

        buffer2.set(shmBuffer[0])
        buffer2.set(shmBuffer[1],shmBuffer[0].byteLength)

        ws.send(buffer2)
              
      } ,100)
    }
    else if ( gyro_cmd == 'stop_plot_compare'){
      console.log("Stopping data")
      console.log(intervalId)
      clearInterval(intervalId)
    }
    else if ( gyro_cmd == 'start_plot_pid_parameters'){


    }
    else if ( gyro_cmd == 'stop_plot_pid_parameters'){

    }

  });

  ws.on('close', () => {
    console.log('WebSocket was closed')
    if ( intervalId ) { clearInterval(intervalId) }
  })

  ws.on('error', () => {
    console.log('WebSocket was closed')
    if ( intervalId ) { clearInterval(intervalId) }
  })

});

// --------------Other Pages-----------------
app.get('/plot', (req, res) => {
  res.render('plot_compare', { title: 'Plot',active_plot:'active' })
});

app.get('/config', (req, res) => {
  res.render('config', { title: 'Configuration',active_config:"active"})
})


// -------------------------------
/*
app.ws('/qry', function(ws, req) {
  //buffer = new ArrayBuffer(7);
  //buffer = new array(7);

  wsLst['qry'] = ws

  ws.on('message', function(buffer) {
    console.log("/qry",buffer);
    sockclt.write(buffer)

  });

  console.log('----------- qry ready --------------------')
  //ws.send('hello')
});
*/

app.listen(port, () => {
  
  var ip = require("ip")
  console.log(`\nApp listening at -> http://${ip.address()}:${port}\n`)
  
})

/*
import sys
import time
from pprint import pprint
import pelcod
import select 
import random
from struct import *

from timeit import default_timer as timer

pd = pelcod.PelcoD()

from sockclnt import SockClnt

sock_mot = SockClnt(**{'server_addr':'/tmp/motionSrv'})
sock_kbd = SockClnt(**{'host':'192.168.254.60','port':4001})

while(True):

        pelco_cmd = sock_kbd.recv()
        pprint(pelco_cmd.hex())

        try:
                cnt = sock_mot.send(pelco_cmd)
        except error:
                print("Error ",error)
                sock_mot.reconnect()
*/