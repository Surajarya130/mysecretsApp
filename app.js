require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const port = process.env.port || 3000;
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");  

 



const app = express();
app.use(express.static("public")); 
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));


app.use(session({
    secret: "My Secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//Mongoose connection
mongoose.connect("mongodb+srv://admin-suraj:Qwerty123@cluster0.kn4km.mongodb.net/userDB", {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});

//Setting up schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose)

//Creating model     
const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res){
    res.render("home");
})

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    User.find({"secret": {$ne: null}}, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                res.render("secrets", {usersWithSecrets: foundUser});
            }
        }
    })
})

app.get("/logout", function(req, res){
    req.logOut();
    res.redirect("/");    
})


app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit")
    }else{
        res.redirect("/login");
    }
})

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    console.log(req.user.id);
    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                })
            }
        }
    })
})

app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.render("/register");
        }else{
            //Save the login session 
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            })
        }
    })

})


app.post("/login", function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            });
        }
    })

})











app.listen(port, function(){
    console.log("running on port 3000");
})
