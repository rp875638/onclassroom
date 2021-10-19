const express = require('express');
const router = express.Router();
const auth = require('../../auth');
const views = require('./views');

router.get('/', auth.required, views.getMeeting);
router.post('/', auth.required, views.createMeeting);
router.post('/schedulemeeting', auth.required, views.scheduleMeeting);
router.delete('/:id',auth.required,views.deleteMeeting);
router.post('/getpassword', auth.required, views.redirectMeetingPassword);
router.get('/:id', auth.required, views.getMeetingPassword);
router.post('/joinmeeting', auth.required, views.joinMeeting);

module.exports = router;