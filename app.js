//jshint esversion:6
//--------------------------------------------------------
const express = require("express");

const bodyParser = require("body-parser");

const _ = require("lodash");

//const date = require(__dirname + "/date.js");

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongoURL = "mongodb+srv://admin-andrew:testpassword@test-cluster-0-ayhzg.mongodb.net/todolistDB"
//--------------------------------------------------------

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, () => {
  console.log("I'm in...");
});

// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
mongoose.set('useFindAndModify', false);

//--------------------------------------------------------
const todoSchema = new Schema({
  name: String
});

const Item = mongoose.model("Item", todoSchema);

const item1 = new Item ({
  name: "Welcome to your todoList"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item"
});

const item3 = new Item ({
  name: "<--- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

/**/

const listSchema = new Schema({
  name: String,
  items: [todoSchema]
});

const List = mongoose.model("List", listSchema);
//--------------------------------------------------------
const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

//--------------------------------------------------------

app.get("/", function(req, res) {


  Item.find({}, function(err, foundItems){

    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err)
        }else{
          console.log("Successfully put items into db.");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
  res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
  
});

app.post("/delete", function(req, res){
  const checkedItem = req.body.checkBox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItem, function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Successfully removed item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItem}}},
      function(err, foundList){
        if(!err){
          res.redirect("/" + listName);
        }else{
          console.log(err);
        }
      });
  }  
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }else{
      console.log(err);
    }
  })
  

  
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
