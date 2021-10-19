const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const UsersSchema = new Schema({
    username: { type: String, required: true, unique: true, index: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true },
    hash: String,
    salt: String,
});

UsersSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UsersSchema.methods.validatePassword = function(password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};

UsersSchema.methods.generateJWT = function() {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    return jwt.sign({
        username:this.username,
        _id: this._id,
        displayName:this.first_name+ " "+this.last_name,
        exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, 'secret');
}

UsersSchema.methods.toAuthJSON = function() {
    return {
        _id: this._id,
        first_name:this.first_name,
        last_name:this.last_name,
        username:this.username,
        email: this.email,
        token: this.generateJWT(),
    };
};

UsersSchema.methods.toJSON = function() {
    return {
        _id: this._id,
        first_name:this.first_name,
        last_name:this.last_name,
        username:this.username,
        email: this.email,
    };
};

mongoose.model('Users', UsersSchema);