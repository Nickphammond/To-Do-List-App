//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


const workItems = [];

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set('useFindAndModify', false);

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const buyFood = new Item({
  name: "Buy Food"
});

const cookFood = new Item({
  name: "Cook Food"
});

const eatFood = new Item({
  name: "Eat Food"
});

const defaultItems = [buyFood, cookFood, eatFood];

const listShcema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listShcema);




app.get("/", function(req, res) {

  Item.find({}, function(err, myItems) {

    if (myItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success");
        }
      });
      res.redirect("/");

    } else {

      res.render("list", {
        listTitle: "Today",
        newListItems: myItems
      });
    }

  });


  app.get("/:customList", function(req, res) {

    const customList = _.capitalize(req.params.customList);


    List.findOne({
      name: customList
    }, function(err, foundList) {
      if (err) {
        console.log(err);

      } else {
        if (!foundList) {
          const list = new List({
            name: customList,
            items: defaultItems
          });

          list.save();
          res.redirect("/" + customList);
        } else {

          res.render("list", {
            listTitle: foundList.name,
            newListItems: foundList.items
          });
        }
      }
    });

  });

  const day = date.getDate();



});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }


});






app.post("/delete", function(req, res) {
  const checkedItemId = req.body.flub;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + listName);
      }

    });

  }


});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
