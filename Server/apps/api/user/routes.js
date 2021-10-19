const express = require('express');
const router = express.Router();
const auth = require('../../auth');
const views = require('./views');

router.post('/login',views.login);
router.post('/signup',views.signup);
router.get('/logout', auth.required,views.logout);

router.get('/profile', auth.required,views.profile);
router.put('/profile', auth.required,views.updateprofile);

module.exports = router;