
var Player = require('./public/js/Player');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var players = {};

var projectiles = {};
var star = {
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50
  };
var TeamMembers = {
  blue: 0,
  red: 0
};
var scores = {
  blue: 0,
  red: 0
};

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('a user connected');

        const rotation =  0
        const x = Math.floor(Math.random() * 700) + 50
        const y = Math.floor(Math.random() * 500) + 50
        const playerId = socket.id
        var team;
        if(TeamMembers.blue <= TeamMembers.red){
          team = 'blue';
          TeamMembers.blue += 1;
        }
        else{
          team = 'red';
          TeamMembers.red += 1;
        }
        console.log(TeamMembers);
        players[socket.id] = new Player(rotation, x, y, playerId, team)
        // create a new player and add it to our players object

        // send the players object to the new player
        socket.emit('currentPlayers', players);

        // send the star object to the new player
        socket.emit('starLocation', star);
        // send the current scores
        socket.emit('scoreUpdate', scores);
        // update all other players of the new player
        socket.broadcast.emit('newPlayer', players[socket.id]);
    
        
    socket.on('disconnect', function () {
        console.log('user disconnected');
        // remove this player from our players object
        team = players[socket.id].team;
        if(team == 'blue'){
          TeamMembers.blue -=1;
        }
        else{
          TeamMembers.red -=1;
        }
        delete players[socket.id];
        // emit a message to all players to remove this player
        io.emit('disconnection', socket.id);
    });

        // when a player moves, update the player data
    socket.on('playerMovement', function (movementData) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].rotation = movementData.rotation;
        // emit a message to all players about the player that moved
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });

    socket.on('projectileFired', (projectile) => {
      
      io.emit('projectileFired', projectile)
    })

    socket.on('shipHit', (data) => {
      if(data.ship.team == 'blue'){
        TeamMembers.blue -= 1;
      }
      else{
        TeamMembers.red -= 1;
      }
      io.emit('shipHit', data);
    })

    socket.on('starCollected', function () {
        if (players[socket.id].team === 'red') {
          scores.red += 10;
        } else {
          scores.blue += 10;
        }
        star.x = Math.floor(Math.random() * 700) + 50;
        star.y = Math.floor(Math.random() * 500) + 50;
        io.emit('starLocation', star);
        io.emit('scoreUpdate', scores);
      });

});


server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});