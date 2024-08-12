const {validationResult}=require('express-validator');
const User=require('../models/user');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');

exports.getSignup=(req,res,next)=>{
    const errors=validationResult(req);
   
    if(!errors.isEmpty()){
        const error=new Error('validation failed');
        error.statusCode=422;
        error.data=errors.array()
        throw error;
    }
    const email=req.body.email;
    const password=req.body.password;
    const name=req.body.name;
    bcrypt.hash(password,12)
    .then(hashPwd=>{
        const user=new User({
            email:email,
            password:hashPwd,
            name:name
        })
        return user.save()
    })
    .then(result=>{
        console.log(result)
        res.status(201).json({
            message:'New user added',
            userId:result._id
        })
    })
    .catch(err=>{
        console.log(err)
        if(!err.statusCode){
            err.statusCode=500;//server error
        }
        return next(err);
    })
}


exports.login=(req,res,next)=>{
    const email=req.body.email;
    const password=req.body.password;
    let loadedUser;
    return User.findOne({email:email})
    .then(user=>{
        if(!user){
            const error=new Error('user not found');
            error.statusCode=404;
            throw error;
        }
        loadedUser=user;
        return bcrypt.compare(password,user.password)
    })
    .then(isEqual=>{
        if(!isEqual){
            const error=new Error('password dont match');
            error.statusCode=422;
            throw error;
        }
        const token=jwt.sign({
            email:loadedUser.email,
            userId:loadedUser._id.toString()
        },'somesupersupersecretkey',{expiresIn:'1h'}
        )
        return res.status(200).json({token:token,userId:loadedUser._id.toString()})
    })
    .catch(err=>{
        console.log(err)
        if(!err.statusCode){
            err.statusCode=500;//server error
        }
        return next(err);
    })
}