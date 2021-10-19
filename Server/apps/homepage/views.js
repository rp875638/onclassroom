const mongoose = require('mongoose');
const Meetings = mongoose.model('Meetings');
exports.index = function(req, res, next) {
    if (req.isAuthenticated()) {
        const host = req.user;
        Meetings.find({ host }, '_id host discription dateTime').then((meetings) => {
                return res.render('index', { meeting: meetings, meetinginvite: '', user: host, page: 'meeting' });
            })
            .catch(err => next(err));
    } else { return res.render('onclassroom', { user: '', page: 'index' }) }
}
exports.profile = function(req, res, next) {
    return res.render('index', { user: req.user, page: 'profile' });
}
exports.result = function(req, res, next) {
    return res.render('index', { user: req.user, page: 'result' });
}
exports.question = function(req, res, next) {
    return res.render('index', { user: req.user, page: 'question' });
}
exports.test = function(req, res, next) {
    return res.render('index', { user: req.user, page: 'test' });
}