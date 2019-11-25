const express=require('express');
const router=express.Router();
const { ensureAuthenticated }= require('./../config/auth');
const AWS = require('aws-sdk');

const User = require('./../models/user');
const Files = require('./../models/files');
 
//dynamoDb
const dynamoDbObj = require('./../models/connect');

//Welcome Page
router.get('/',(req,res)=>res.render('welcome'));

//dahsboard Page
router.get('/dashboard',ensureAuthenticated,(req,res)=>{

    const currentuser =req.user;
    const email = req.user.email;

    if(req.user.name == 'admin'){

        // let getdata = () => {
        //     var params = {
        //         TableName: 'user',
        //         Key: {
        //             'email': email
        //         },
        //         "level": {
        //             ComparisonOperator: "NE",
        //             AttributeValueList: [ {"S":"A"} ]
        //        }
        //     };

        //     dynamoDbObj.get(params, function (err, userdata) {
                
        //         if (err){ throw err}
        //         else{

        //             var params1 = {
        //                 TableName: 'files',
        //                 Key: {
        //                     'email': email
        //                 }
        //             };

        //             dynamoDbObj.get(params1, function (err, filedata) {

        //                 console.log(currentuser);
        //                 console.log(filedata);
        //                 console.log(userdata);
        //                 if (err){ throw err}
        //                 else{

        //                     res.render('dashboard',{
        //                         user: currentuser,
        //                         data: filedata,
        //                         logins: userdata
        //                     })
        //                 }
        //             })
        //         }
        //     })
        // }

        // getdata();

        
        User.find({ level: { $ne: 'A' }},(err, output) => {
            // console.log(output);
            Files.find({},(err, data) => {
                
                res.render('dashboard',{
                    user: currentuser,
                    data: data,
                    logins: output
                })
            })
        })
      
    }
    else{

        // let getdata = () => {

        //     var params= {
        //         TableName: 'files',
        //         Key: {
        //             'email': email
        //         }
        //     };

        //     dynamoDbObj.get(params, function (err, filedata) {

        //         if (err){ throw err}
        //         else{

        //             console.log(filedata);

        //             res.render('dashboard',{
        //                 user: currentuser,
        //                 data: filedata,
        //                 logins: { }
        //             })
        //         }
        //     })
        // }

        Files.find({ email : req.user.email },(err, data) => {
            res.render('dashboard',{
                
                user: currentuser,
                data: data,
                logins: {}
            })
        })
    }
});

//prescriptions
router.get('/files',ensureAuthenticated,(req,res)=>{

    const currentuser =req.user;
    const email = req.user.email;
    
    Files.find({ email : req.user.email },(err, data) => {
        
        res.render('files',{
            
            user: currentuser,
            data: data,
            logins: {}
        })
    })
});

//list of all users
router.get('/listUsers',ensureAuthenticated,(req,res)=>{

    const currentuser =req.user;
    const email = req.user.email;
    
    User.find({ level: { $ne: 'A' }},(err, output) => {
        // console.log(output);
        Files.find({},(err, data) => {
            
            res.render('users',{
                user: currentuser,
                data: data,
                logins: output
            })
        })
    })
});

//schedules
router.get('/schedule',ensureAuthenticated,(req,res)=>{

    const currentuser =req.user;
    const email = req.user.email;
    
    Files.find({ email : req.user.email },(err, data) => {
        
        //get schedule from dynamodb
        var params = {
        TableName: 'files',
        FilterExpression: "#sn = :i",
        ExpressionAttributeNames:{
            "#sn": "name"
        },
        ExpressionAttributeValues : {
            // ':i'  : 'mySchedule-1574717348492'
            ':i'  : 'admin'
        }
        };

        
        dynamoDbObj.scan(params, function (err, filedata) {
            
            if (err){ throw err}
            else{
                
                res.render('schedule',{
            
                    user: currentuser,
                    data: filedata.Items,
                    logins: {}
                })
            }
        })
    })
});

//addSchedule
router.get('/addSchedule',ensureAuthenticated,(req,res)=>{

    const currentuser =req.user;
    const email = req.user.email;
    
    Files.find({ email : req.user.email },(err, data) => {
        
        res.render('addschedule',{
            
            user: currentuser,
            data: data,
            logins: {}
        })
    })
});

//add shedule manually
router.post('/addSchedule', (req,res)=>{

    const { pName, tablet, startDate, endDate, morningCnt, middayCnt, eveningCnt, bedtimeCnt, docName} = req.body;

    let errors = [];

    if(!pName || !tablet || !startDate ||!endDate || !docName){
        errors.push({ msg:'Please fill all required fields!' });
    }
    
    if(errors.length > 0){
        res.render('addSchedule',{
            user: req.user,
            errors,
            tablet,
            startDate,
            endDate,
            docName
        });
    }
    else{

        const dynamoDbObj = require('./../models/connect');
        var myScheduleName = 'mySchedule'+('-')+Date.now();

        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!

        var yyyy = today.getFullYear();
        if (dd < 10) {
        dd = '0' + dd;
        } 
        if (mm < 10) {
        mm = '0' + mm;
        } 
        var today = dd + '/' + mm + '/' + yyyy;

        var input = {
            'name': req.user.name,'fileName': myScheduleName, 'startDate': startDate, 'endDate': endDate, 'morningTabCnt': morningCnt,'expiryDate':endDate, 'modifiedDate':today,
            'middayTabCnt': middayCnt, 'eveTabCnt': eveningCnt, 'bedtimeTabCnt': bedtimeCnt , 'tabletName' : tablet, 'patientName':pName, 'docName':docName, 'createdDate':today
        };

        var paramsDb = {
            TableName: 'files',
            Item:  input
        };

        dynamoDbObj.put(paramsDb, function (err, data) {
                    
            if (err) {
                console.log(err);
                req.flash('error_msg','Error Occured while creating schedule!');
                res.redirect('/addSchedule');
            } else {
                console.log('Schedule Added');
                req.flash('success_msg','Schedule Created!');
                res.redirect('/addSchedule');
            }
        });
    }
});

module.exports=router;