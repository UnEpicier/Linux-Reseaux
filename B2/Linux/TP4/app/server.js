const express = require('express')
const app = express()

const cors = require('cors')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const handlebars = require('express-handlebars')

const hbs = handlebars.create({
	defaultLayout: 'base',
	extname: 'hbs',
	encoding: 'utf-8',
	layoutsDir: `./views/layouts`,
	partialsDir: `./views/partials`,
})

app.use(cors())
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.set('view engine', 'hbs')
app.engine('hbs', hbs.engine)

// Routes
app.use(require('./router'))

app.listen(3000, () => {
	console.log(`ClockJS started on http://localhost:${port}/`)
})
