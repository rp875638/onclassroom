const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const Exam = mongoose.model('Exams');
const Questions = mongoose.model('Questions');
const passport = require('passport');


//user authentication views
exports.login =async function(req,res,next){
    let data = req.body;
    if(data.username && data.password){
          passport_login(req, res, next)
    }
    else{
        return res.status(404).json({message:"Please provide username or password"})
    }
}
exports.signup = function(req,res,next){
    let user = req.body;
    if(user.username && user.password && user.first_name&&user.last_name){
        Users.exists({ username: user.username })
        .then(() => {
            const finalUser = new Users(user);
            finalUser.setPassword(user.password);
            return finalUser.save()
                .then(() =>{
                    res.status(200).json({ user: finalUser.toAuthJSON() })
                });
        }).catch((error) => next(error));
    }
    else{
        return res.status(404).json({message:"Please provide username or password"})
    }
}
exports.current = function(req, res, next) {
    const { payload: { id } } = req;

    return Users.findById(id)
        .then((user) => {
            if (!user) {
                return res.json({user:''});
            }
            return res.json({ user: user.toAuthJSON() });
        })
        .catch(err);
}
exports.logout = function(req,res,next){
    req.logout();
    res.status(200).json({message:"Succssfully logout"});
}
function passport_login(req, res, next) {
    return passport.authenticate('local', (err, passportUser, info) => {
        if (err) {
            return next(err);
        }
        if (passportUser) {
            req.logIn(passportUser, function(err) {
                if (err) { return next(err); }
                return res.status(200).json({ user: passportUser.toAuthJSON() });
            });
        }else{
            next(info);
        }
    })(req, res, next);
}

//user views
exports.profile = function(req, res, next) {
    const { payload: { _id } } = req;

    return Users.findById(_id)
        .then(user => user?res.status(200).json({ user: user.toJSON() }):res.status(500).json('no user found'))
        .catch(error => next(error));
}
exports.updateprofile = function(req, res, next) {
    const { payload: { _id } } = req;
    return Users.updateOne({_id},req.body)
        .then(user => user?res.status(200).json("profile successfully updated"):res.json('no user found'))
        .catch(error=> next(error))
}