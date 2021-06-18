function plot_compare(){

    console.log("RUNNING PLOT COMPARE")
    Plotly.newPlot('plotDiv', [{
        y: [0],
        mode: 'lines',
        line: {color: '#80CAF6'},
        name:"Gyro1"
      },{
        y: [0],
        mode: 'lines',
        line: {color: '#DF56F1'},
        name:"Gyro2"
      }
    ]);      
}
