const {validationResult}=require('express-validator');
const Post=require('../models/post');
const User=require('../models/user');
const path=require('path');
const fs=require('fs');
const io=require('../socket')

exports.getPost=(req,res,next)=>{
    const currPage=req.query.page || 1;
    const perPage=2;
    let totalItems;
    return Post.find().countDocuments()
    .then(count=>{
        totalItems=count;
        return Post.find().skip((currPage-1)*perPage).limit(perPage)
    })
    .then(posts=>{
        if(!posts){
            const error=new Error('posts not found');
            error.statusCode=400;
            throw error;  
        }
        res.status(200).json({
            posts:posts,
            message:'Fetching successfully',
            totalItems:totalItems
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

exports.postPost=async(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        const errormsg=new Error("validation failed.the input data is incorrect")
        errormsg.statusCode=422;
        throw errormsg;
    }
    if(!req.file){
        const errormsg=new Error("image not found.")
        errormsg.statusCode=422;
        throw errormsg;
    }
    const title=req.body.title;
    const content=req.body.content;
    const imgUrl=req.file.path.replace(/\\/g, '/');//IMP-----------
    let creator;
    const post=new Post({
        title:title,
        content:content,
        creator:req.userId,//i get from isAuth
        imgUrl:imgUrl
    })
    try{
        await post.save()
        const user=await User.findById(req.userId)
        user.posts.push(post)//array in db User
        await user.save();
        io.getIO().emit('posts',{action:'create',post:post})
        res.status(201).json({
            message:"success",
            post:post,
            creator:{_id:user._id,name:user.name}
        })
    }
    catch(err){
        console.log(err)
        if(!err.statusCode){
            err.statusCode=500;//server error
        }
        return next(err);
    }
}

exports.getPostId=(req,res,next)=>{
    const postId=req.params.postId;
    Post.findById(postId)
    .then(post=>{

        if(!post){
            const error=new Error('post not found');
            error.statusCode=400;
            throw error;
        }
        res.status(200).json({
            message:'Post fetched',//not neccessary
            post:post
        })
    })
    .catch((err)=>{
        console.log(err)
        if(!err.statusCode){
            err.statusCode=500
        }
        return next(err);
    })
}
const clearFilepath=filePath=>{
    filePath=path.join(__dirname,'..',filePath);
    fs.unlink(filePath,err=>{
        console.log(err);
    })
}
exports.editPost=(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        const errormsg=new Error("validation failed.the input data is incorrect")
        errormsg.statusCode=422;
        throw errormsg;
    }
    const postId=req.params.postId;
    const title=req.body.title;
    const content=req.body.content;
    let imgUrl=req.body.image;
    if(req.file){
        imgUrl=req.file.path.replace(/\\/g, '/');
    }
    if(!imgUrl){
        const error=new Error('no image picked')
        error.statusCode=422;
        throw error;
    }
    Post.findById(postId)
    .then(post=>{
        if(!post){
            const error=new Error('post not found');
            error.statusCode=400;
            throw error;  
        }
        if(req.userId !== post.creator.toString()){
            const error=new Error('not authorized to edit');
            error.statusCode=403;//forbidden 
            throw error;  
        }
        if(imgUrl!==post.imgUrl){
            clearFilepath(post.imgUrl)
        }
        post.title=title;
        post.content=content;
        post.imgUrl=imgUrl;
        return post.save()
    })
    .then(result=>{
        res.status(200).json({message:'Post Updated',post:result})
    })
    .catch(err=>{
        console.log(err);
        if(!err.statusCode){
            err.statusCode=500;
        }
        return next(err);
    })
}

exports.deletePost=(req,res,next)=>{
    const postId=req.params.postId;
    let imgUrl;
    Post.findById(postId)
    .then(post=>{
        if(!post){
            const error=new Error('post not found');
            error.statusCode=404;
            throw error;
        }
        if(req.userId !== post.creator.toString()){
            const error=new Error('not authorized to edit');
            error.statusCode=403;//forbidden 
            throw error;  
        }
        imgUrl=post.imgUrl;
        clearFilepath(imgUrl)
        return Post.findByIdAndDelete(postId);
    })
    .then(post=>{
        return User.findById(req.userId)
    })
    .then(user=>{
        user.posts.pull(postId)
        return user.save()
    })
    .then(result=>{
        res.status(200).json({message:'Post deleted'})
    })
    .catch(err=>{
        console.log(err);
        if(!err.statusCode){
            err.statusCode=500;
        }
        return next(err);
    })
}

