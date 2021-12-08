const express=require('express');
const app=express();
const path=require('path');
const mongoose=require('mongoose');
const bodyparser=require('body-parser');
const passport=require('passport');
const LocalStrategy=require('passport-local').Strategy
const bcrypt=require('bcryptjs');
const session=require('express-session');
const flash=require('connect-flash');
const moment=require('moment');
const { listenerCount } = require('cluster');
const Emitter=require('events')
const dotenv=require("dotenv");

const port=process.env.PORT || 3200


   





    //  MONGOOSE CONNECTION
    
    dotenv.config({path:'./config.env'})
const DB=process.env.DATABASE

mongoose.connect(DB,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true
});

const db=mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {

    console.log("Connected");
});


let menuschema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    size:{
        type:String,
        required:true
    }
});
    let cartschema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    size:{
        type:String,
        required:true
    },
    quantity:{
        type:Number,
        required:true,
        default:0
    },
    username:{
        type:String,
        required:true
    }

})

let userschema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        required:true,
        default:'user'

    }
},{timestamps:true})


let orderschema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    status:{
        type:String,
        default:"Order_Placed"
    },
    items:{
        type:Object,
        required:true
    }
},{timestamps:true})

let menu=mongoose.model('Menu',menuschema);
let cart=mongoose.model('Cart',cartschema);
let user=mongoose.model('User',userschema);
let order=mongoose.model('Order',orderschema);








app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.json());


//passport Setup
passport.use(new LocalStrategy({usernameField:'email'},(email,password,done)=>{
    user.findOne({email:email})
    .then(userr=>{
        if(!userr){
            return done(null,false)
        }
        bcrypt.compare(password,userr.password,(err,isMatch)=>{
            if(isMatch){
                return done(null,userr)
            }
            else{
                return done(null,false)
            }
        })
    })
    .catch(err=>{
        console.log(err);
    })
}))

//flash Setup



//Session setup
app.use(session({
    secret:"Node",
    resave:true,
    saveUninitialized:true
}))


passport.serializeUser((user,done)=>{
    done(null,user.id);
});
passport.deserializeUser((id,done)=>{
    user.findById(id,(err,user)=>{
        done(err,user);

    })
})

app.use(passport.initialize());
app.use(passport.session());


//flash
app.use(flash());

//global variable
app.use((req,res,next)=>{
    res.locals.success_msg=req.flash(('success_msg'));
    res.locals.error_msg=req.flash(('error_msg'));
    res.locals.error=req.flash(('error'));
    res.locals.currentUser=req.user;
    next();
});



const EventEmitter=new Emitter()



function ensureauthentication(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}



function ensureadminauthentication(req,res,next){
    if(req.isAuthenticated() && req.user.role==='admin'){
        return next();
    }
    res.redirect('/login');
}




  
   


app.get('/',(req,res)=>{
    menu.find()
    .then(pizzas=>{
        res.render('home',{pizza:pizzas});
    })
   
});
app.get('/cart',(req,res)=>{
  let currentUser=req.user;
    if(currentUser){
    cart.find({username:req.user.name})
    .then(cartpizza=>{
        res.render('cart',{pizzas:cartpizza,totalprice:0});
    })
   }
   else{
       res.render('cart',{pizzas:"",totalprice:0})
   }
   
});
app.get('/login',(req,res)=>{
    res.render('login')
})

app.get('/register',(req,res)=>{

    res.render('register')
})

app.get('/orderplace', ensureauthentication,(req,res)=>{
    res.render('orderplace')
})

app.get('/logout',(req,res)=>{
    req.logOut();
    res.redirect('/login')
})

app.get('/customer/orders',ensureauthentication,(req,res)=>{
    order.find({name:req.user.name},null,{sort:{'createdAt':-1}})
    .then(ord=>{
      res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0,post-check=0,pre-check=0')
        res.render('order',{orderss:ord,moment:moment})
    })
   
})

app.get('/admin/orders',ensureadminauthentication,(req,res)=>{
    order.find({ status: { $ne: 'completed' } }, null, { sort: { 'createdAt': -1 }})
    .then(orders=>{
        if(req.xhr) {
            return res.json(orders)
        } else {
         return res.render('adminorders')
        }
    })
})

//post request

app.post('/updatecart',(req,res)=>{ 
    
  
    cart.findOne({$and:[{name:req.body.name},{size:req.body.size},{username:req.user.name}]})
    .then(pizza=>{
        if(pizza){
            pizza.quantity++;
            pizza.price=pizza.price*pizza.quantity
           
            pizza.save()
           
        }
        else{
            const newpizza=new cart({

                name:req.body.name,
                price:req.body.price,
                size:req.body.size,
                quantity:1,
                username:req.user.name


            })
          
            newpizza.save()
            .then(data=>{
                
            })
            .catch(err=>{
                console.log(err);
            })
            
              
        
            
           
        }

    })
    
})

    app.get('/remove/:id',(req,res)=>{
        cart.findOne({_id:req.params.id})
        .then(piz=>{
            if(piz.quantity>1){
                piz.quantity--;
                piz.price=piz.price/2;
                piz.save();
                res.redirect('/cart')
               
            }
            else{
                cart.deleteOne({_id:piz.id})
                .then(pizza=>{
                    res.redirect('/cart')
                })
            }
           
        })
       
    })
    app.get('/orderstatus/:id',(req,res)=>{
        order.findOne({_id:req.params.id})
        .then(order=>{
            res.render('orderstatus',{order:order})
        })
    })


    app.post('/register',(req,res)=>{
        const{name,email,password}=req.body;
        user.findOne({$or:[{name:name},{email:email}]})
        .then(userr=>{
            if(userr){
                req.flash('error_msg','User already exist')
                return res.redirect('/register')
            }

           
            const newuser=new user({
                name:name,
                email:email,
                password:password

            })
            bcrypt.genSalt(10,(err,salt)=>
            bcrypt.hash(newuser.password,salt,(err,hash)=>{
                if(err)
                throw err;
                newuser.password=hash;
               
            newuser.save()
            .then(userr=>{
                req.flash('success_msg','Account created successfully')
                res.redirect('/login')
            })
            .catch(err=>{
                console.log(err);
            })
            })
            
            )


        })

    })


    const geturl = (req) => {
        return req.user.role === 'admin' ? '/admin/orders' : '/customer/orders'
    }

    app.post('/login',
    passport.authenticate('local'),
    function(req, res) {
      // If this function gets called, authentication was successful.
      // `req.user` contains the authenticated user.
      res.redirect(geturl(req));
    });


app.post('/ordernow',(req,res)=>{
    const{name,email,phone,address}=req.body;
    cart.find({})
    .then(item=>{
        const neworder=new order({
            name:name,
            email:email,
            phone:phone,
            address:address,
            items:item
           

        });
        neworder.save()
        .then(orders=>{
            req.flash('success_msg','Order Placed Successfully')

            EventEmitter.emit('orderplaced',orders);

            res.redirect('/customer/orders')
        })
        
    })


})


app.post('/admin/order/status',(req,res)=>{
    order.updateOne({_id:req.body.orderId},{$set:{
        status:req.body.status
    }})
    .then(order=>{
        res.redirect('/admin/orders')
    })
})




  const server= app.listen(port,()=>{
    console.log("Port Started on 3200");
})

const io=require('socket.io')(server,{
    cors:{
        origin:'*'
    }
});

io.on('connection',(socket)=>{
    socket.on('join',(adminroom)=>{
        socket.join(adminroom)
        console.log(socket.id);
    })
})


EventEmitter.on('orderplaced',(data)=>{
    io.to('adminroom').emit('orderplaced',data)
})
