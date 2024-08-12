const jwt=require('jsonwebtoken');
//jwt token check
module.exports=(req,res,next)=>{
    const authHeader=req.get('Authorization');
    if(!authHeader){
        const error=new Error('Authorization failed');
        error.statusCode=401;
        throw error;
    }
    const token=authHeader.split(' ')[1];//'bearer token'---frontend
    let decodedToken;
    try{
        decodedToken=jwt.verify(token,'somesupersupersecretkey')

    }catch(err){
        err.statusCode=500;
        throw err;
    }
    if(!decodedToken){
        const error=new Error('not authenticated');
        error.statusCode=401;
        throw error;
    }
    req.userId=decodedToken.userId;
    next();
}