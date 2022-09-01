//jshint esversion:6

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + '/views'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

//setting up sessions
app.use(session({
    secret: 'Iwillupdatemysecret_later.',
    resave: false,
    saveUninitialized: false
}));

//configure(manage sessions)
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    thirdPartyId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((_id, done) => {
    User.findById(_id, (err, user) => {
        done(err, user);
    });
});

//Google 
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ thirdPartyId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//facebook
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
    profileFields: ['id', 'displayName', 'photos', 'email'],
    enableProof: true
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ thirdPartyId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/', (req, res) => {
    res.render('home');
});


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
});


app.get('/auth/facebook',
  passport.authenticate('facebook', { authType: 'reauthenticate', scope: ['user_friends', 'manage_pages'] }));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
});


app.route('/register')
.get((req, res) => {
    res.render('register');
})
.post((req, res) => {
    const {username, password} = req.body;
    User.register({username: username},password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secret');
            });
        }
    });
});

app.route('/login')
.get((req, res) => {
    res.render('login');
})
.post((req, res) => {
    const {username, password} = req.body;

    const newUser = new User({
        email: username,
        password, password
    });

    req.login(newUser, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local', {failureRedirect: '/login'})(req, res, () => {
                res.redirect('/secrets');
            });
        }
    });
});

app.get('/submit', (req, res) => {
    res.render('submit');
});

app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (!err) {
            res.redirect('/');
        }
    });
});


app.listen(3000, () => {
    console.log('server starting at port 3000');
});