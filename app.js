var express = require('express');

var app = express();

var bodyParser = require("body-parser");

const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

var logout = require('express-passport-logout');


var uname;


app.get('/success', (req, res) => res.send("Welcome "+req.query.username+"!!"));
app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  User.findById(id, function(err, user) {
    cb(err, user);
  });
});

var mongoose = require("mongoose");

const Schema = mongoose.Schema;
const UserDetail = new Schema({
      username: String,
      password: String
    });
const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo');

app.use(express.static("public"));

var methodOverride = require("method-override");
app.use(methodOverride("_method"));

mongoose.connect("mongodb://localhost/campdb");

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));





var commentSchema = new mongoose.Schema({
    text : String,
    author : String
});

var Comment = mongoose.model("Comment", commentSchema);

var campSchema  = new mongoose.Schema({
  user : String,
    name: String,
    image: String,
    description: String,
    address: String,
    comments : [{
        type: mongoose.Schema.Types.ObjectId,
        ref : Comment
    }
    ]
})
var Camp = mongoose.model("Camp", campSchema);


var userSchema  = new mongoose.Schema({
    name: String,
    email: String,
    camps : [campSchema]
})
var User = mongoose.model("User", userSchema);

var newUser = new User({
    name: "Sameer",
    email : "sameer43445@gmail.com"
})





// newUser.camps.push({
//     name: "ondublog",
//     image: "https://newhampshirestateparks.reserveamerica.com/webphotos/NH/pid270015/0/540x360.jpg",
//     desc : "lets try if this works",
//     address : "1019 E uni dr"
// })

// newUser.save(function(err, user){
//     if(err){
//         console.log(err);
//     } else {
//         console.log(user);
//     }
// });

app.get('/', (req, res) => res.sendFile('auth.html', { root : __dirname}));

const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
      UserDetails.findOne({
        username: username
      }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false);
        }

        if (user.password != password) {
          return done(null, false);
        }
        return done(null, user);
      });
  }
));

app.post('/',
  passport.authenticate('local', { failureRedirect: '/error' }),
  function(req, res) {
  uname = req.user.username;
    res.redirect('/campgrounds');
  });

// app.get("/", function(req, res){
//     res.redirect("/campgrounds");
// })

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
app.get("/campgrounds", function(req, res){

    Camp.find({}, function(err, campsFound){
        if (err){

            console.log(err);
        }
        else {
        //  console.log("HIIII sirrr" +username);
             res.render("home", {camps: campsFound, us:uname});
        }
    })

})

app.get("/campgrounds/new", function(req, res){
    res.render("addpost",{us : uname})
})

app.post("/campgrounds", function(req, res){
    Camp.create(req.body.camp, function(err, addedCamp){
        if (err){
            console.log(err);
        }
        else {
              console.log("lmao" +uname);

            res.redirect("/campgrounds")
                }
            })

        })


app.get("/campgrounds/:id", function(req, res){
    Camp.findById(req.params.id).populate("comments").exec(function(err, editCamp){
        if(err){
            console.log(err);
        } else {
            console.log(editCamp);
             res.render("campdetail", {camp: editCamp});
        }
    })

})

app.get("/campgrounds/:id/comments", function(req, res){
    Camp.findById(req.params.id, function(err, camp ){
         if(err){
        console.log(err);
    } else {
        res.render("addcmnt", {camp : camp})
    }
    })

})

app.get("/campgroundedit/:id", function(req, res){
    Camp.findById(req.params.id, function(err, camp ){
         if(err){
        console.log(err);
    } else {
        res.render("editform", {camp : camp})
    }
    })

})

app.post("/campgrounds/:id/comments", function(req, res){
   Camp.findById(req.params.id, function(err, foundcamp){
    if(err){
        console.log(err);
    } else {
         Comment.create({
                text : req.body.comment.text,
                author : req.body.comment.author
            }, function(err, comment){
                if(err){
                    console.log(err);
                } else {
                     foundcamp.comments.push(comment);
                     foundcamp.save();
                     console.log("added new comment");
            res.redirect("/campgrounds/"+foundcamp._id);

                }

   })
     }

})
});

app.put("/campgrounds/:id", function(req, res){

    Camp.findByIdAndUpdate(req.params.id, req.body.camp, function(err, updCamp){
        if(err){
            console.log(err);
        } else {
            res.redirect("/campgrounds")
        }
    })
})

app.post("/search", function(req, res){
var t = req.body.term;
  Camp.find({"name": {$regex: t+'.*'}}, function(err, camp){
    if(err){
      console.log(err);
    } else {
      res.render("srchcamps", {camps:camp});
    }
  })
})


app.delete("/campgrounds/:id", function(req, res){
    Camp.findByIdAndDelete(req.params.id, function(err, updCamp){
        if(err){
            console.log(err);
        } else {
            res.redirect("/campgrounds")
        }
    })
})

app.listen(process.env.PORT || 3000, function(req, res){
    console.log("Server started!!");
})
