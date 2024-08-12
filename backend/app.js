const path=require('path');
const bodyparser=require('body-parser');
const mongoose=require('mongoose')
const multer=require('multer');
const express=require('express');
const app=express();
const feedRoutes=require('./routes/feed')
const authRoutes=require('./routes/auth')

const fileStorage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'images');
    },
    filename:(req,file,cb)=>{
        cb(null,new Date().toISOString().replace(/:/g, '-')+'-'+file.originalname);
    }
})
const fileFilter=(req,file,cb)=>{
    if(file.mimetype==='image/png' || file.mimetype==='image/jpg' ||file.mimetype==='image/jpeg'){
        cb(null,true);
    }else{
        cb(null,false);
    }
}
app.use(bodyparser.json());
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'))
app.use('/images',express.static(path.join(__dirname,'images')))

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    next();
})

app.use('/feed',feedRoutes);
app.use('/auth',authRoutes);

app.use((error,req,res,next)=>{
    const message=error.message;
    const statusCode=error.statusCode || 500;
    const data=error.data;
    res.status(statusCode).json({message:message,data:data})
})
mongoose.connect('mongodb+srv://ishaan:ishaan%4017@restapi.fi6vs0b.mongodb.net/restapi?retryWrites=true&w=majority&appName=restapi',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true
})

.then(result=>{
    const server=app.listen(8080);
    const io=require('./socket').init(server);
    io.on('connection',socket=>{
        console.log('client connected')
    })
})
.catch(err=>console.log(err))