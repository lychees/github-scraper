var P = require('./src/profile.js');
var F = require('./src/follow.js');
var fs = require('fs');
var path = require('path');
var users = [];

var limit = 10; // concurrency limit

function cleanup(user) {
  // remove dupes from list of users
  users = users.filter (function (v, i, a) {
    return a.indexOf (v) === i;
  }); // http://stackoverflow.com/a/14821032/1148249

  // remove the current user we are checking from list of users
  var index = users.indexOf(user);
  users.splice(index, 1); // http://stackoverflow.com/a/3954451/1148249

  return true;
}

function crawl(user) {
  var filename = './data/'+user+'.log';

  P.profile(user, function(error, profile){

    // crawl list of followers
    F.followers(user, function(error, followers){
      followers.map(function(u){ users.push(u) });

      // crawl list of following
      F.following(user, function(error, following){
        following.map(function(u){ users.push(u) });

        console.log(" - - - - > " + user + " < - - - - - ");
        console.log("Followers:",followers.length);
        console.log("Following:",following.length);

        profile.following = following.join(',');
        profile.followers = followers.join(',');
        profile.last = new Date().getTime();
        fs.appendFile(filename, JSON.stringify(profile)+'\n', function (err) {
          if (err) {
            throw err;
          }
          console.log(filename+' saved!');
          cleanup(user); // remove user from users array (dont re-crawl)
          console.log('Users:',users.length);
          return crawl(users[0]); // next iteration
        });
      });
    });
  })
}

function checkLastCrawled(user){
  var filename = path.normalize('./data/'+user+'.log');
  console.log(filename, __filename);
  // check when the last time we crawled a user profile was
  // by reading the mtime on the file
  fs.stat(filename, function(err, stats){
    if(err) { // file doesn't exist, run crawl!
      crawl(user);
    }
    console.log(stats.mtime);
    // only check every 24 hours
    var mtime = new Date(stats.mtime);
    var now = new Date();
    var diff = Number(now.getTime()-mtime.getTime());
    console.log(now + ' - ' + mtime + ' = '+diff );

    // if the difference is bigger than 24 hours crawl again.
    if(diff > 24 * 3600 * 1000) {
      crawl(user);
    } else {
      cleanup(user); // remove user from users array (dont re-crawl)
      return crawl(users[0]); // next iteration
    }
  })
}

checkLastCrawled('alanshaw', function(){
  console.log('done');
})

// function keep going



// Patient Zero
var user = 'alanshaw';
// crawl(user);