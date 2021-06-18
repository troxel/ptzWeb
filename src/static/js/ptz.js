const ipAddr = location.hostname

const wsUrlCmd = `ws://${ipAddr}:3000/cmd`
const wbsockCmd = new WebSocket(wsUrlCmd)
wbsockCmd.binaryType = 'arraybuffer'

wbsockCmd.addEventListener('message', function (event) {
    //console.log('Message from server ', event)

    if ( event.data instanceof ArrayBuffer ){
       
        let packetView = new Uint8Array(event.data)

        console.log(event.data)

        // There are only a few official PelcoD query responses
        if ( packetView[0] == 0xFF ){

            if ( packetView[3] == 0x59){
                let pos = (((packetView[4] & 0xff) << 8) | (packetView[5] & 0xff))
                pos = (new Int16Array([pos]))[0] 
                pos /= 10 // position is multipled by 10 in motionSrv 
                console.log("pos=",pos)
                $('#qryPanDeg').html(pos.toString() );
            }
            else if ( packetView[3] == 0x5B){
                let pos = (((packetView[4] & 0xff) << 8) | (packetView[5] & 0xff))
                pos = (new Int16Array([pos]))[0] 
                pos /= 100 // position is multipled by 10 in motionSrv 
                console.log("pos=",pos)
                $('#qryTltDeg').html(pos.toString() );
            }
            else if ( packetView[3] == 0x61){
                if ( packetView[5] == 1 )
                console.log("Homing Pan Complete")
                $('#homingPanComplete').html( "Homing Pan Complete" );
            }
            else if ( packetView[3] == 0x63){
                if ( packetView[5] == 1 )
                console.log("Homing Tilt Complete")
                $('#homingTltComplete').html( "Homing Tilt Complete" );
            }
        }
          

    } else {
        console.error("Error: ArrayBuffer is expected")
    }    
   
  });

const wsUrlData = `ws://${ipAddr}:3000/data`
const wbsockData = new WebSocket(wsUrlData)
wbsockData.binaryType = 'arraybuffer'

wbsockData.addEventListener('message', function (event) {
    
    if ( event.data instanceof ArrayBuffer ){
       
        var GyroView = new Float64Array(event.data)
        //console.log(GyroView)

        // The 5th (zero based) element is omega z
        // There are 17 - 8 elements per buffer so 22

        console.log(GyroView[5],GyroView[22],GyroView.length)

        Plotly.extendTraces('plotDiv', {
            y: [[ GyroView[5] ],[ GyroView[22] ]]
          }, [0,1], 401)

 
    } else {
        console.log("Error: ArrayBuffer is expected " , event.data)
    }    
   
  });

// -------------------------------------------
// Relying upon browserify to pull in this code
var PelcoD = require('pelcod')
var pelcod = new PelcoD()

var ptAddr = 0x01
SndBuf = new Uint8Array(7)
SndBuf[0] = 0xFF
SndBuf[1] = ptAddr

// ------------------------------------------
$(document).ready(function() {
    /*
    $('cursor').mousedown(function(e) {
      var offset = $(this).offset();
      let x = e.pageX - offset.left;
      let y = e.pageY - offset.top;
      console.log(x,y)
    })
    */
   //buff = new Uint8Array(2);
   // ------- Keyboard draggable widget -------------------- 
   buff = new Uint8Array(7)
   $("#cursor").draggable({
        revert:true,
        revertDuration: 200,
        grid:[2,2],
        scroll: false,
        containment: "parent",
        drag: function(event, ui) {
           
            xPos = ui.position.left - 187
            yPos = ui.position.top - 187
            //console.log(ui.position.top,ui.position.left)
            $('#posX').text('x: ' + xPos);
            $('#posY').text('y: ' + yPos);
            buff[0] = xPos
            buff[1] = yPos
            //console.log(buff.buffer.toString())
            //rtn = wbsockCmd.send(buff.buffer)
            //console.log("rtn = ",rtn) 

            var upFlg   = yPos > 0
            var leftFlg = xPos > 0

            yPos = Math.abs(yPos)
            xPos = Math.abs(xPos)
            if ( yPos > 255 ){ yPos = 255 } 
            if ( xPos > 255 ){ xPos = 255 } 

            xPos = Math.ceil(.003 * Math.pow(xPos,2))
            yPos = Math.ceil(.003 * Math.pow(yPos,2))

            console.log("xy = ", xPos,yPos)

            var cmd = pelcod.up(upFlg)
                .left(leftFlg)
                .down(!upFlg)
                .right(!leftFlg)
                .setPanSpeed(xPos)
                .setTiltSpeed(yPos)
               
            console.log(cmd.bytes.getBuffer())
           
            rtn = wbsockCmd.send(cmd.bytes.getBuffer())
            
        }, 
        stop: function(event,ui){
            var rtn = pelcod.up(true).left(true).setPanSpeed(0).setTiltSpeed(0)
            wbsockCmd.send(rtn.bytes.getBuffer()) 
            wbsockCmd.send(rtn.bytes.getBuffer()) 
        }
    })
    
    $("#qryPanCmd").click( function(){
        SndBuf[2] = 0x00
        SndBuf[3] = 0x51
        rtn = wbsockCmd.send(SndBuf)        
    })    
    
    $("#qryTltCmd").click( function(){
        SndBuf[2] = 0x00
        SndBuf[3] = 0x53
        rtn = wbsockCmd.send(SndBuf)        
    })
    
    // ----------- Homing -------------------
    $("#homingPanCmd").click( function(){
        SndBuf[2] = 0x00
        SndBuf[3] = 0x61
        rtn = wbsockCmd.send(SndBuf)
        $('#homingPanComplete').html( "Homing Processing..." );
    })

    $("#homingTltCmd").click( function(){
        SndBuf[2] = 0x00
        SndBuf[3] = 0x63
        rtn = wbsockCmd.send(SndBuf)
        $('#homingTltComplete').html( "Tilt Processing..." );
    }) 
    
    $("#homingPanTltCmd").click( function(){
        SndBuf[2] = 0x00
        SndBuf[3] = 0x65
        rtn = wbsockCmd.send(SndBuf)
        $('#homingPanTltComplete').html( "Pan/Tilt Processing..." );
    })

    // ----------- Stable -------------------
    $("#stablePanCmd").click( function(){
        SndBuf[2] = 0x00
        SndBuf[3] = 0x77
        SndBuf[5] = 0x1
        rtn = wbsockCmd.send(SndBuf)
        $('#stablePanStatus').html( "Pan Stable Processing" );
    })

    $("#stableTltCmd").click( function(){
        SndBuf[2] = 0x00
        SndBuf[3] = 0x73
        rtn = wbsockCmd.send(SndBuf)
        $('#stableTltStatus').html( "Tilt Stable Processing" );
    }) 
    
    $("#stablePanTltCmd").click( function(){
        SndBuf[2] = 0x00
        SndBuf[3] = 0x75
        rtn = wbsockCmd.send(SndBuf)
        $('#stablePanTltStatus').html( "Pan/Tilt Stable Processing" );
    })

    // -------------- Sensitivity Slider ---------------
    $("#keybrdSliderPan").on("slidechange", function(event,ui){
        console.log("slider ", ui.value)
        $("#keybrdSliderValuePan").html(" " +  (ui.value/100).toFixed(2))

        SndBuf[2] = 0x00
        SndBuf[3] = 0x83  
        SndBuf[4] = ui.value 
        SndBuf[5] = $( "#keybrdSliderTlt" ).slider( "option", "value" )
        rtn = wbsockCmd.send(SndBuf)
    })  

    $("#keybrdSliderTlt").on("slidechange", function(event,ui){
        console.log("slider ", ui.value)
        $("#keybrdSliderValueTlt").html(" " + (ui.value/100).toFixed(2))

        SndBuf[2] = 0x00
        SndBuf[3] = 0x83  
        SndBuf[4] = $( "#keybrdSliderPan" ).slider( "option", "value" ) 
        SndBuf[5] =  ui.value
        rtn = wbsockCmd.send(SndBuf)
    })


    // -------------- Presets ---------------------------
    $("#presetCmd").click( function(){

        let presetId = $( "#presetId" ).val();
        let presetAction = $( "#presetAction" ).val();

        SndBuf[2] = 0x00
        SndBuf[3] = presetAction
        SndBuf[5] = presetId
        console.log(SndBuf)
        rtn = wbsockCmd.send(SndBuf)
    })

    // ---- Plot Control -----
    $("#start_plot_compare").click( function(){
        rtn = wbsockData.send("start_plot_compare")
    })

    $("#stop_plot_compare").click( function(){
        rtn = wbsockData.send("stop_plot_compare")
    })

    $("#tiltStatusCmd").click( function(){
        SndBuf[2] = 0x00
        SndBuf[3] = 0x69
        SndBuf[4] = 0x00
        rtn = wbsockCmd.send(SndBuf)
    })

    /*
    var isDragging = false;
    $("#pad")
    .mousedown(function() {
        isDragging = false;
    })
    .mousemove(function(e) {
        isDragging = true;
        console.log(e.pageX)
     })
    .mouseup(function() {
        var wasDragging = isDragging;
        isDragging = false;
        if (!wasDragging) {
            //$("#pad").toggle();
        }
    });
    */

})