const express = require('express')
const router = express.Router()

// Serving files like css/js/images
router.use(express.static('public'))

// Index
router.get('/', (_, res) => {
	return res.render('pages/index')
})

// 404 error
router.use((_, res) => {
	return res.status(404).render('__error', { title: '404 Error' })
})

module.exports = router