const express = require('express')
const enableWs = require('express-ws')

const app = express()
enableWs(app)

app.set('view engine', 'pug')
app.set('views','./src/views');

app.use(express.static('./src/static'))

app.get('/', (req, res) => {
	res.render('index', { title: 'PTZ Control' })
	//res.send('Test')  
 })

app.ws('/', (ws, req) => {
		console.log('----------- / ready ---------')
	    ws.on('message', msg => {
					
					console.log(msg)
					
		        })

	    ws.on('close', () => {
		            console.log('WebSocket was closed')
		        })
})

app.listen(3000)
