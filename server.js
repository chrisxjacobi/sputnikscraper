//dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// requiring models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");


var Promise = require("bluebird");

mongoose.Promise = Promise;


var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));


app.use(express.static("public"));

// config database with mongoose
mongoose.connect("mongodb://root:firsthost1@ds119608.mlab.com:19608/heroku_00lsqnfm");
var db = mongoose.connection;

db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// success logging in with mongoose
db.once("open", function() {
    console.log("Mongoose connection successful 1 .");


});


// routes

app.get("/", function(req, res) {
    res.send(index.html);
});

// A GET request to scrape sputnikmusic
app.get("/scrape", function(req, res) {

    // Dependencies:

    // Snatches HTML from URLs
    var request = require('request');
    // Scrapes our HTML
    var cheerio = require('cheerio');

    console.log("\n***********************************\n" +
        "sputnik for chris\n" +
        "\n***********************************\n");

    request("http://www.sputnikmusic.com/", function(error, response, html) {

        var $ = cheerio.load(html);

        var tooltips = $("a.tooltip");

        console.log(tooltips.length);

        // grabbing links on the sidebar
        tooltips.each(function(i, element) {

            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).text();
            result.link = $(this).attr("href");

            console.log(result);

            var entry = new Article(result);
            entry.save(function(error, doc) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(doc);
                }

            });



        });
    });
    // Tell the browser that we finished scraping the text
    res.send("Scrape Complete");
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
    // Grab every doc in the Articles array
    Article.find({}, function(error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        // Or send the doc to the browser as a json object
        else {
            res.json(doc);
        }
    });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    Article.findOne({ "_id": req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        // now, execute our query
        .exec(function(error, doc) {
            // Log any errors
            if (error) {
                console.log(error);
            }
            // Otherwise, send the doc to the browser as a json object
            else {
                res.json(doc);
            }
        });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    var newNote = new Note(req.body);

    // And save the new note the db
    newNote.save(function(error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        // Otherwise
        else {
            // Use the article id to find and update its note
            Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
                // Execute the above query
                .exec(function(err, doc) {
                    // Log any errors
                    if (err) {
                        console.log(err);
                    } else {
                        // Or send the document to the browser
                        res.send(doc);
                    }
                });
        }
    });
});

app.delete("/articles/:id", function(req, res) {

    Article.update({ "_id": req.params.id }, {$unset: {note:"$oid" }}, function(err, response){
      if (err) {
        console.log(err);
        res.send(err);
      } else {
        console.log(response);
        res.send(response);

      }
    })

});

// Listen on port 3000
app.listen(3000, function() {
    console.log("App running on port 3000!");
});
