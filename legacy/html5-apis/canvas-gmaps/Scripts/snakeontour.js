/*
   SNAKE ON TOUR

   Copyright 2015 Jose Carlos Román Rubio (jcdotnet@hotmail.com)
  
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   
   You may obtain a copy of the License at
  
       http://www.apache.org/licenses/LICENSE-2.0
  
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    
 */

// Came constants

var CANVAS_WIDTH = 640
var CANVAS_HEIGHT = 640

var SNAKE_WIDTH = 20 // CANVAS_WIDTH % SNAKE_WIDTH MUST BE 0
var SNAKE_HEIGHT = 20 // CANVAS_HEIGHT % SNAKE_HEIGHT MUST BE 0

var MAX_FRAMES_PER_SECOND = 30

var TEXT_OFFSET = 650

// formatted address separated by commas returned by the gmaps geocoding web service
var address = []

// canvas variables 
var canvas1, canvas2, context1, context2

// animation variables
var idAnimation, framesPerSecond;
var posX, posY
var direction, velX, velY

// sprites and color arrays
var whatever = [], foods = [], colors = []

// game variables 
var level, score, lives



window.onload = function () { // the page is fully loaded including graphics

    $("#btnNewGame").click(function () {
        var url = "http://maps.google.com/maps/api/geocode/json?address=" + $("#txtAddress").val() + "&sensor=false" // geocoding web service
        $.getJSON(url, function (data) {
            try {
                address = data.results[0].formatted_address.split(',')
                initializeMap(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng)
            }

            catch (err) {
                $("#lblMessage").html("cannot find this location, please enter a valid one")
            }
        });
    });

    window.addEventListener("keydown", handlekeydown, false)
    window.addEventListener("keyup", handlekeyup, false)

    $("#txtAddress").on("keydown", function () { $("#lblMessage").html(" ") })
}


/////////////////  event handlers  //////////////////////////

function handlekeydown(event) {
    if (event.keyCode == 37 && velX != 1) // left arrow key
        velX = -1, velY = 0, direction = "west"
    if (event.keyCode == 38 && velY != 1) // up arrow key
        velY = -1, velX = 0, direction = "north"
    if (event.keyCode == 39 && velX != -1)  // right arrow key
        velX = 1, velY = 0, direction = "east"
    if (event.keyCode == 40 && velY != -1) // down arrow key
        velY = 1, velX = 0, direction = "south"
}

function handlekeyup(event) {
    // for now, our whatever never stops
    // speed = 0;
}


/////////////////  helper functions  //////////////////////////

function getRandomColor() {
    var r = Math.floor(255 * Math.random()) | 0,
        g = Math.floor(255 * Math.random()) | 0,
        b = Math.floor(255 * Math.random()) | 0;
    return '#' + r.toString(16) + g.toString(16) + b.toString(16);
}

function intersects(x1, y1, width1, height1, x2, y2, width2, height2) {
    return (x1 < x2 + width2 &&
            x1 + width1 > x2 &&
            y1 < y2 + height2 &&
            height1 + y1 > y2)
}

/////////////////  init functions  //////////////////////////

function initializeMap(lat, lng) {

    canvas1 = document.getElementById("layer1");
    context1 = canvas1.getContext("2d");

    canvas2 = document.getElementById("layer2");
    context2 = canvas2.getContext("2d");

    canvas1.width = CANVAS_WIDTH
    canvas2.width = 1136
    canvas1.height = canvas2.height = CANVAS_HEIGHT

    context1.rect(0, 0, canvas1.width, canvas1.height);
    context1.stroke();

    var google_tile = "http://maps.google.com/maps/api/staticmap?sensor=false&scale=1&center=" + lat + "," + lng + "&zoom=16&size=" + 638 + "x" + 638 /* + "&markers=color:blue|label:START!|" + lat + "," + lng */;

    var imageObj = new Image();
    imageObj.src = google_tile;

    imageObj.onload = function () {

        context1.drawImage(imageObj, 1, 1);

        $("#game-options").hide()

        initializeGame()
        requestAnimationFrame(gameLoop)

        var milliseconds = Math.floor((Math.random() * 5000) + 1);
        setTimeout(spawnFood, milliseconds)
    };
}

function initializeGame() {
    velX = 0, velY = 1
    level = 1, score = 0, lives = 10

    framesPerSecond = 15

    whatever.length = 0, foods.length = 0, colors.length = 0;
    whatever.push({ x: 320, y: 0, w: SNAKE_WIDTH, h: SNAKE_HEIGHT });
    whatever.push({ x: 320, y: SNAKE_HEIGHT, w: SNAKE_WIDTH, h: SNAKE_HEIGHT });

    colors.push('#003300')
    colors.push('#003300')
}


/////////////////  game functions  //////////////////////////

function spawnFood() {
    // gets a random x, y and size food
    var randomX = Math.floor((Math.random() * CANVAS_WIDTH));
    var randomY = Math.floor((Math.random() * CANVAS_HEIGHT));
    var size = Math.floor((Math.random() * 25) + 10);

    // the food must be spawned inside the map 
    if (randomX < 0) randomX = 0;
    else if (randomX + size > CANVAS_WIDTH) randomX = CANVAS_WIDTH - size;

    if (randomY < 0) randomY = 0;
    else if (randomY + size > CANVAS_HEIGHT) randomY = CANVAS_HEIGHT - size;

    foodColor = getRandomColor()
    foods.push({ x: randomX, y: randomY, w: size, h: size, color: foodColor })

    var milliseconds = Math.floor((Math.random() * 10000) + 1);
    setTimeout(spawnFood, milliseconds)
}

function wallCollision() {
    if (whatever[0].x < 0) {
        whatever[0].x = CANVAS_WIDTH - SNAKE_HEIGHT
    }
    else if (whatever[0].x + SNAKE_WIDTH > CANVAS_WIDTH) {
        whatever[0].x = 0;
    }

    if (whatever[0].y < 0) {
        whatever[0].y = CANVAS_HEIGHT - SNAKE_HEIGHT
    }
    else if (whatever[0].y + SNAKE_HEIGHT > CANVAS_HEIGHT) {
        whatever[0].y = 0
    }
}

function checkCollisions() {

    // wall collision (mr whatever /* bounces * changes direction clockwise */ escapes and enters again)
    wallCollision();

    // food collisions (scores up)
    for (var i = foods.length - 1; i >= 0; i--) {
        if (intersects(whatever[0].x, whatever[0].y, SNAKE_WIDTH, SNAKE_HEIGHT, foods[i].x, foods[i].y, foods[i].w, foods[i].h)) {

            score += (level * 10)

            var frontX, frontY
            switch (direction) {
                case "north": frontX = whatever[0].x, frontY = whatever[0].y - SNAKE_HEIGHT; break;
                case "south": frontX = whatever[0].x, frontY = whatever[0].y + SNAKE_HEIGHT; break;
                case "east": frontX = whatever[0].x + SNAKE_WIDTH; frontY = whatever[0].y; break;
                case "west": frontX = whatever[0].x - SNAKE_WIDTH; frontY = whatever[0].y; break;
            }

            colors.unshift(foods[i].color)
            whatever.unshift({ x: frontX, y: frontY, vx: velX, vy: velY, w: SNAKE_WIDTH, h: SNAKE_HEIGHT });

            wallCollision();

            context2.clearRect(foods[i].x, foods[i].y, foods[i].w, foods[i].h)
            foods.splice(i, 1);

            if ((whatever.length - 2) % 10 == 0) {
                level++
                lives++
                if (framesPerSecond <= MAX_FRAMES_PER_SECOND) framesPerSecond++
            }

        }
    }

    // whatever collision (mr whatever loses a life, dies when run out of lives) 
    for (var i = 1; i < whatever.length; i++) {
        if (intersects(whatever[0].x, whatever[0].y, whatever[0].w, whatever[0].h, whatever[i].x, whatever[i].y, whatever[i].w, whatever[i].h))
            lives--
    }

}

/////////////////  animation functions  //////////////////////////

function gameLoop(timeStamp) {

    setTimeout(function () {
        idAnimation = requestAnimationFrame(gameLoop);

        clear()
        update(timeStamp)

        draw()

    }, 1000 / framesPerSecond);
}


function clear() {
    context2.clearRect(0, 0, canvas2.width, canvas2.height)
}

function update(timeStamp) {

    // update whatever
    var frontX, frontY
    frontX = whatever[0].x + (SNAKE_WIDTH) * velX
    frontY = whatever[0].y + (SNAKE_HEIGHT) * velY


    tail = whatever.pop();
    tail.x = frontX
    tail.y = frontY
    whatever.unshift(tail);

    checkCollisions()

    // check lives
    if (lives == 0) {
        if (localStorage.bestScore == undefined || score > localStorage.bestScore) localStorage.bestScore = score
        $("#game-options").show()
        cancelAnimationFrame(idAnimation)
    }
}

function draw() {

    // draws whatever
    context2.save()
    context2.fillStyle = colors[0]
    context2.fillRect(whatever[0].x, whatever[0].y, SNAKE_WIDTH, SNAKE_HEIGHT)

    for (var i = 1; i < whatever.length; i++) {
        context2.beginPath();
        context2.arc(whatever[i].x + SNAKE_WIDTH / 2, whatever[i].y + SNAKE_HEIGHT / 2, whatever[i].w / 2, 0, 2 * Math.PI, false);
        context2.fillStyle = colors[i]
        context2.fill();

    }
    context2.restore()

    // draws food
    for (var i = 0; i < foods.length; i++) {
        context2.save()
        context2.fillStyle = foods[i].color
        context2.fillRect(foods[i].x, foods[i].y, foods[i].w, foods[i].h)
        context2.restore()
    }

    // draws texts 
    var offsetY = 0
    context2.font = "30px sans serif";  
    context2.fillStyle = '#003300';

    // draws formatted address
    context2.fillText("Location", TEXT_OFFSET, offsetY += 60);
    context2.font = "20px sans serif";
    for (var i = 0; i < address.length; i++)
        context2.fillText(address[i].trim(), TEXT_OFFSET, offsetY += 20);

    context2.font = "30px sans serif";

    // draws score    
    if (localStorage.bestScore == undefined || localStorage.bestScore != undefined && score > localStorage.bestScore) {
        context2.save()
        context2.fillStyle = getRandomColor()
        context2.fillText("Score: " + score + " :) RECORD :)", TEXT_OFFSET, offsetY += 50);
        context2.restore()
    }
    else 
        context2.fillText("Score: " + score, TEXT_OFFSET, offsetY += 50);
    

    context2.fillText("Snake length: " + whatever.length, TEXT_OFFSET, offsetY += 50);
    context2.fillText("Level: " + level, TEXT_OFFSET, offsetY += 50);    

    // draws lives left
    context2.save()

    if (lives <= 3) context2.fillStyle = "red"

    context2.fillText("Lives: " + lives, TEXT_OFFSET, offsetY += 50);
    
    // draws messages
    context2.fillStyle = colors[1]
    context2.fillText("Best score on this browser: " + (localStorage.bestScore != undefined ? localStorage.bestScore : 0), TEXT_OFFSET, CANVAS_HEIGHT - 100);
    context2.font = "30px sans serif";
    context2.fillStyle = colors[0]
    context2.fillText("SNAKE ON TOUR", TEXT_OFFSET, 30);
    context2.fillText("Game created by JC", TEXT_OFFSET, CANVAS_HEIGHT - 40);
    context2.font = "20px sans serif";
    context2.fillText("(jcdotnet@hotmail.com)", TEXT_OFFSET, CANVAS_HEIGHT- 10);
    
    context2.restore()

    context2.font = "20px sans serif";
    context2.fillText("Sounds and improvements soon! ", TEXT_OFFSET, offsetY += 50);
}