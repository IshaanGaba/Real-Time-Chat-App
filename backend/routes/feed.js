const {body}=require('express-validator');
const express=require('express');
const router=express.Router();
const feedController=require('../controllers/feed');
const isAuth=require('../middleware/isAuth');


router.get('/posts',isAuth,feedController.getPost);

router.post('/posts',isAuth,[
    body('title').trim().isLength({min:5}),
    body('content').trim().isLength({min:5}),
],
feedController.postPost);

router.get('/posts/:postId',isAuth,feedController.getPostId);

router.put('/posts/:postId',isAuth,[
    body('title').trim().isLength({min:5}),
    body('content').trim().isLength({min:5}),
],
feedController.editPost);

router.delete('/posts/:postId',isAuth,feedController.deletePost);

module.exports=router;
