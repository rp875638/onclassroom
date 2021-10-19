const mongoose = require('mongoose');
const Meetings = mongoose.model('Meetings');
const jwt = require('jsonwebtoken');


exports.createMeeting = function(req, res, next) {
    const { password, discription } = req.body;
    const { payload: { _id } } = req;
    try {
        const meetings = new Meetings({ discription, host: _id, dateTime: new Date() });
        meetings.setPassword(password);
        meetings.save();
        return res.status(200).json({ meeting: meetings, user: req.user });
    } catch (err) {
        next(err)
    };

}

exports.joinMeeting = function(req, res, next) {
    const { meeting_id, meeting_password } = req.body;
    Meetings.updateOne({ _id: meeting_id }, { $addToSet: { users: req.user } })
    Meetings.findOne({ _id: meeting_id }).then((meeting) => {
            if (meeting.validatePassword(meeting_password)) {
                meeting.updateOne({ _id: meeting_id }, { users: req.user })
                meeting.users.addToSet(req.user);
                meeting.save();
                let is_host = meeting.is_host(req.payload._id);
                var token = jwt.sign({ meetingId: meeting._id, displayName: req.payload.displayName, _id: req.payload._id, is_host }, 'secret');
                return res.status(200).json(token);
            } else {
                next('Password not match')
            }
        })
        .catch(err => next(err));
}

exports.scheduleMeeting = function(req, res, next) {
    const { dateTime, password, discription } = req.body;
    const { payload: { _id } } = req;
    try {
        const meetings = new Meetings({ discription, host: _id, dateTime });
        meetings.setPassword(password);
        meetings.save();
        return res.status(200).json({ meeting: meetings });
    } catch (err) {
        next(err)
    };
}

exports.deleteMeeting = function(req, res, next) {
    Meetings.deleteOne({ _id: req.params.id })
        .then(result => {
            return res.status(200).json({ result });
        })
        .catch(err => {
            next(err)
        });
}

exports.getMeetingPassword = function(req, res, next) {
    console.log(req.body)
    return res.status(200).json({ meetingId: req.params.id, user: req.user });
}

exports.redirectMeetingPassword = function(req, res, next) {
    const { _id } = req.body;
    console.log(_id)
    return res.redirect(`/meeting/${_id}`);
}

exports.getMeeting = function(req, res, next) {
    const host = req.payload;
    Meetings.find({ host }, '_id host discription dateTime').then((meetings) => {
            return res.status(200).json({ meeting: meetings, user: host });
        })
        .catch(err => next(err));
}