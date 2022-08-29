//jshint esversion:6

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const ejs = require('ejs');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + '/views'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = process.env.SECRET;
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.render('home');
});

app.route('/register')
.get((req, res) => {
    res.render('register');
})
.post((req, res) => {
    const {username, password} = req.body;
    const newUser = new User({
        email: username,
        password: password
    });
    newUser.save((err) => {
        if (!err) {
            res.render('secrets')
        } else {
            console.log(err);
        }
    });
    // User.find((err, foundUser) => {
    //     if (!err) {
    //         if (!foundUser){
    //             newUser.save((err) => {
    //                 if (!err) {
    //                     res.render('secrets')
    //                 } else {
    //                     console.log(err);
    //                 }
    //             })
    //         }
    //     }
    // }) 
});

app.route('/login')
.get((req, res) => {
    res.render('login');
})
.post((req, res) => {
    const {username, password} = req.body
    User.findOne({email: username}, (err, foundUser) => {
        if (!err) {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render('secrets');
                } else {
                    ('<h1>INCORRECT PASSWORD</h1>');
                    // res.render('home');
                }
            } else {
                console.log('no found error');
            }
        }
    })
});

app.get('/submit', (req, res) => {
    res.render('submit');
});

app.get('/logout', (req, res) => {
    res.render('home');
})

app.listen(3000, () => {
    console.log('server starting at port 3000');
});