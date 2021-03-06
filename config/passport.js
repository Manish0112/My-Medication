const LocalStrategy = require('passport-local').Strategy;
// const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('./keys');

//Google Oauth
const GoogleStrategy = require('passport-google-oauth20');

//FB oauth
const FacebookStrategy = require('passport-facebook').Strategy;

const AmazonStrategy = require('passport-amazon').Strategy;

//Load User Model
// const User = require('./../models/user');

//dynamoDb
const dynamoDbObj = require('./../models/connect');

module.exports = function(passport) {
    passport.use(
        new LocalStrategy( {usernameField: 'email'}, (email, password, done) => {

            //dynamo
            var params= {
                TableName: 'user',
                Key: {
                    'email': email
                }
            };

            dynamoDbObj.get(params, function (err, data) {

                if (err){ throw err}
                else{
                    
                    if(Object.entries(data).length === 0 && data.constructor === Object){
                        return done(null, false, { message: 'That email is not registered!'});
                    }

                    var user=data.Item;
                    
                    if(password.localeCompare(user.password) == 0){
                        return done(null,user);
                    }
                    else{
                        return done(null, false, { message: 'Password incorrect.'});
                    }
                }
            })

            //Match User
            // User.findOne( { email: email} )
            // .then(user => {
                
            //     if(!user){
            //         return done(null, false, { message: 'That email is not registered!'});
            //     }

            //     //Match Password
            //     bcrypt.compare(password, user.password, (err, isMatch)=>{
            //         if(err) throw err;

            //         if(isMatch){
            //             return done(null,user);
            //         }
            //         else{
            //             return done(null, false, { message: 'Password incorrect.'});
            //         }
            //     });
            // })
            // .catch( err => console.log(err));
        })
    );

    passport.use(
        new GoogleStrategy(
            {
                clientID: keys.googleClientID,
                clientSecret: keys.googleClientSecret,
                callbackURL: '/users/auth/google/callback'
            },
            (accessToken, refreshToken, profile, done) => {

            const email=profile.emails[0].value;
            
            // User.findOne( { email: email} )
            //     .then(user => {

            //     if(user){
            //         return done(null,user);
            //     }
                
            //     //New user
            //     const name=profile.displayName;
                
            //     const password=123456;
            //     const newUser = new User({
            //         name,
            //         email,
            //         password
            //     });

            //     //Hash password
            //     bcrypt.genSalt(10, (err,salt) => 
            //        bcrypt.hash(newUser.password, salt, (err,hash) => {
            //             if(err) throw err;
            //             //set password to hashed
            //             newUser.password=hash;
            //             //save user
            //             newUser.save()
            //             .then(user => {
            //                 return done(null,user);
            //             })
            //             .catch(err=>console.log(err));

            //        }))

            // })
            // .catch( err => console.log(err));
                
        }));

    passport.use(
        new FacebookStrategy(
            {
                clientID: keys.faceBookID,
                clientSecret: keys.faceBookSecret,
                callbackURL: "/users/auth/facebook/callback"
            },
            (accessToken, refreshToken, profile, done) => {
                
                const name=profile.displayName;
                const email='abc@gmail.com';
                const password=123456;
                // const newUser = new User({
                //     name,
                //     email,
                //     password
                // });


                // //Hash password
                // bcrypt.genSalt(10, (err,salt) => 
                //    bcrypt.hash(newUser.password, salt, (err,hash) => {
                //         if(err) throw err;
                //         //set password to hashed
                //         newUser.password=hash;
                //         //save user
                //         newUser.save()
                //         .then(user => {
                //             return done(null,user);
                //         })
                //         .catch(err=>console.log(err));

                //    }))
            }
        ));

    passport.serializeUser((user, done) => {
        done(null, user.email);
    });
    
    passport.deserializeUser((email, done) => {

        var params= {
            TableName: 'user',
            Key: {
                'email': email
            }
        };

        dynamoDbObj.get(params, function (err, data) {

            if (err){ throw err}
            else{
                done(err, data.Item);
            }
        })
    });


    //amazon login
    passport.use(new AmazonStrategy({
        clientID: keys.AMAZON_CLIENT_ID,
        clientSecret: keys.AMAZON_CLIENT_SECRET,
        securityProfileId: 'amzn1.application.66a54c5df5cb4ddeaaddd4170029bb70',
        callbackURL: "/users/auth/amazon/callback"
      },
      function(accessToken, refreshToken, profile, done) {
          console.log(profile);
        // User.findOrCreate({ amazonId: profile.id }, function (err, user) {
        //   return done(err, user);
        // });
      }
    ));
}