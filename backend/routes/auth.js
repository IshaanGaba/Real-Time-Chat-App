const express=require('express');
const {body}=require('express-validator');
const router=express.Router();
const authController=require('../controllers/auth');
const User=require('../models/user');

router.put('/signup',[
    body('email')
    .isEmail()
    .withMessage('Please enter valid email')
    .custom((value,{req})=>{
        return User.findOne({email:value})
        .then(userDoc=>{
            if(userDoc){
                return Promise.reject('Email already exists');
            }
        })
    }).normalizeEmail(),
    body('password').trim().isLength({min:5}),
    body('name').trim().not().isEmpty()
],authController.getSignup);

router.post('/login',authController.login);

module.exports=router