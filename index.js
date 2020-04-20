const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')
const app = express()
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler
} = require('./handlers.js')

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---

// Variables 
var snakeColor = '#FFB366';

// START
//  This function is called everytime your snake is entered into a game.
//  cherrypy.request.json contains information about the game that's about to be played.
// TODO: Use this function to decide how your snake is going to look on the board.
app.post('/start', (request, response) => {
  console.log("GAME START");

  // Response data
  const data = {
    color: snakeColor,
    headType: "sand-worm",
    tailType: "round-bum"
  }

  return response.json(data)
})

// MOVE
// This function is called on every turn of a game. It's how your snake decides where to move.
// Valid moves are "up", "down", "left", or "right".
// TODO: Use the information in cherrypy.request.json to decide your next move.
app.post('/move', (request, response) => {
  var data = request.body; // Game data from JASON payload.
  var turn = data.turn; // Current game turn
  var boardSize = data.board.width; // Board size
  var possibleMoves = ['up', 'right', 'down', 'left']; // Index of possible moves.
  
  // CREAT BOARD
  // Represent the grid as a 2-dimensional array
  // i = Column, Y position
  // j = row, X position
  var board = [];
  for ( let i = 0; i < boardSize; i++ ) {
      board[i] = [];
      for ( let j = 0; j < boardSize; j++ ) {
          board[i][j] = 'empty';
      }
  }
  
  // MAP OBJECTS

  // Map Food
  var food = Object.values( data.board.food ); // Converts json food data to array.
  // Map 
 
  // UPDATE BOARD
  // Takes boardToUpdate array and updates coordinate from updateArray with an update Value
  // eg. Take Food array and updates it's coordniates on game board with value 'Food'.
  var updateBoard = function( boardToUpdate, updateArray, updateValue ) {
    for ( let i = 0; i < updateArray.length; i++ ) {
      var updateArrayIndex = Object.values(updateArray[i]);
      boardToUpdate[ (updateArrayIndex[0]) ][ (updateArrayIndex[1]) ] = updateValue;
    }
  }

  // PATHING LOGIC

  var findShortestPath = function() {
      
    // Starting coordinates
    var posY = data.you.y;
    var posX = data.you.x;

    // Each "location" will store its coordinates
    // and the shortest path required to arrive there
    var location = {
      y: posY,
      x: posX,
      path: [],
      status: 'start'
    };

    // Initialize the queue with the start location already inside
    var queue = [location];

    // Loop through the grid searching for food
    while (queue.length > 0) {
      // Take the first location off the queue
      var currentLocation = queue.shift();

      // Explore each direction
      for ( let i = 0; i < possibleMoves.length; i++ ) {
        var newLocation = exploreInDirection( currentLocation, i, grid);
        if (newLocation.status === 'food') {
          return newLocation.path;
        } else if (newLocation.status === 'valid') {
          queue.push(newLocation);
        }
      }
    }

    // No valid path found
    return false;

  };

  // Check Location Status
  // This function will check a location's status
  // (a location is "valid" if it is on the grid, is not an "obstacle",
  // and has not yet been visited by our algorithm)
  // Returns "valid", "invalid", "blocked", or "food"
  var locationStatus = function(location, grid) {
    var gridSize = grid.length;
    var y = location.y;
    var x = location.x;

    if (location.x < 0 ||
        location.x >= gridSize ||
        location.y < 0 ||
        location.y >= gridSize) {

      // location is not on the grid--return false
      return 'invalid';
    } else if (grid[y][x] === 'food') {
      return 'food';
    } else if (grid[y][x] !== 'empty') {
      // location is either an obstacle or has been visited
      return 'blocked';
    } else {
      return 'valid';
    }
  };


  // Explores the grid from the given location in the given
  // direction
  var exploreInDirection = function( currentLocation, direction, grid ) {
    var newPath = currentLocation.path.slice();
    newPath.push(direction);

    var y = currentLocation.posY;
    var x = currentLocation.posX;

    if (direction === "up" ) {
      y -= 1;
    } else if (direction === "right" ) {
      x += 1;
    } else if (direction === "down" ) {
      y += 1;
    } else if (direction === "left" ) {
      x -= 1;
    }

    var newLocation = {
        y: y,
        x: x,
        path: newPath,
        status: 'Unknown'
      };
    newLocation.status = locationStatus(newLocation, grid);

    // If this new location is valid, mark it as 'Visited'
    if (newLocation.status === 'Valid') {
      grid[newLocation.posY][newLocation.posX] = 'Visited';
    }

    return newLocation;
  };

  // Returns a direction based on passed X and Y coordinates
  var getDirection = function( x, y ) {
      if ( y < data.you.y && x == data.you.x ) {
        return "up"
      } else if ( x > data.you.x && y == data.you.y ) {
        return "right"
      } else if ( y > data.you.y && x == data.you.x ) {
        return "down"
    } else if ( x < data.you.x && y == data.you.y ) {
        return "left"
    }
  }

  // MOVE
  //updateBoard( board, food, "food" );
  //console.log(findShortestPath([0,0], grid));

  // Execute move
  var choice = Math.floor(Math.random() * possibleMoves.length);
  var snakeMove = possibleMoves[choice];
  console.log( 'MOVE ' + (turn+1) + ': ' + snakeMove );
  return response.json({ move: snakeMove });
})

// END
// This function is called when a game your snake was in ends.
// It's purely for informational purposes, you don't have to make any decisions here.
app.post('/end', (request, response) => {
  console.log('GAME END');
  return response.json({ message: "ok" });
})

// PING
// The Battlesnake engine calls this function to make sure your snake is working.
app.post('/ping', (request, response) => {
  return response.json({ message: 'pong' });
})

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler)
app.use(notFoundHandler)
app.use(genericErrorHandler)

app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'))
})