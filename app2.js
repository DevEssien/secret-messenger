//jshint esversion:6

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const path = require('path');
const bcrypt = require('bcrypt');

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
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        const newUser = new User({
            email: username,
            password: hash
        });
        newUser.save((err) => {
            if (!err) {
                res.render('secrets')
            } else {
                console.log(err);
            }
        });
    })
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
                bcrypt.compare(password, foundUser.password, (err, result) => {
                    if (result === true) {
                        res.render('secrets');
                    } else {
                        res.send('<h1>INCORRECT PASSWORD</h1>');
                    }
                })
            } else {
                console.log('no found user');
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