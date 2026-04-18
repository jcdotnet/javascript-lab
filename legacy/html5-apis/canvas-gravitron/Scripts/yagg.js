/*
   YET ANOTHER GRAVITRON GAME

   Copyright 2015 Jose Carlos Román Rubio (jcdotnet@hotmail.com)
  
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   
   You may obtain a copy of the License at
  
       http://www.apache.org/licenses/LICENSE-2.0
  
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    
 */

// game constants

var WALL_TOP = 100
var WALL_HEIGHT = 20

var SPRITE_WIDTH = 40
var SPRITE_HEIGHT = 80

var METEOR_SIZE = 40

var PATTERN1 = [0, 80, 160] // y coords
var PATTERN2 = [80, 160, 0, 240, 80, 160]  
var PATTERN3 = [0, 250, 500] 
var PATTERN4 = [0, 100, 400, 500] 
var PATTERN5 = [0, 80] 
var PATTERN6 = [0, 240] 
var PATTERN7 = [0, 400]
var PATTERN8 = [0, 80, 160, 240, 320]

// canvas
var canvas, ctx, mouse = true

// animation
var startTime, elapsedTime
var idAnimation, idMeteors, idGoodOnes
var direction = "down"
var posX, posY
var velX, velY
var rotationAngle = 0
var hsv = {h: 0, s: 1, v: 1}


// game dimensions

var wallBottom 

// game elements

var stars = []
var meteors
var goodOnes

// game control
var playing

/////////////// events handlers /////////////////////////

$(function () {

    // get the canvas
    canvas = document.getElementById('myCanvas');
   
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // get the context
    ctx = canvas.getContext('2d');

    ctx.fillStyle = "white"
    ctx.strokeStyle = "white"

    // set handlers to events
    window.addEventListener("keydown", handleKeydown, false)
    window.addEventListener("keyup", handleKeyup, false)
    window.addEventListener("resize", handleResize);

    // start the game
    startGame();

})

function handleKeydown (event)
{
    if (event.keyCode == 37 && velX != 1) // left arrow key
        velX = -10
    /* else */ if (event.keyCode == 39 && velX != -1)  // right arrow key
        velX = 10

    if (event.keyCode == 32) // space
    {
        if (mouse)
        {
            mouse = false
            $("#myCanvas").css("cursor", "none")
        }
        else 
        {
            mouse = true
            $("#myCanvas").css("cursor", "auto")
        }
            
    }
}

function handleKeyup(event) {
        velX = 0
}

function handleResize()
{
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    wallBottom = canvas.height - 100
}

/////////////////////// helper functions ///////////////////////////

function toTime(milliseconds) {
    var tenthsOfSeconds = Math.floor(milliseconds / 100) % 10

    var seconds = Math.floor(milliseconds / 1000) % 60
    seconds = seconds < 10 ? "0" + seconds : seconds

    var minutes = Math.floor(Math.floor(milliseconds / 1000) / 60)

    return minutes + ":" + seconds + "." + tenthsOfSeconds

}

function intersects(x1, y1, width1, height1, x2, y2, width2, height2) {
    return (x1 < x2 + width2 &&
            x1 + width1 > x2 &&
            y1 < y2 + height2 &&
            height1 + y1 > y2)
}

function isInside(x1, y1, width1, height1, containerX, containerY, width, height) {
    // check this 
    return x1 >= containerX && x1 + y1 >= containerY && x1 + width1 <= width && y1 + height1 <= height
}

// returns an integer between min and max (both inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// gets a random y coordinate that assures that all the meteors in the pattern passed are inside the game area
function getRandomY(pattern) {
    var max = Math.max.apply(null, pattern)    
    return getRandomInt(WALL_TOP + 1, wallBottom - METEOR_SIZE - max)//;wallBottom - METEOR_SIZE)
}

// converts a color component from decimal to hexadecimal
function toHex(color) {
    var hex = color.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function HSVtoRGB(h, s, v) {
    if (arguments.length === 1) { // if passing an object instead 
        s = h.s, v = h.v, h = h.h;
    }
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/////////////// game functions /////////////////////

function startGame() {

    // initialize game basics
    wallBottom = canvas.height - 100
    posX = canvas.width / 2 - 20
    posY = canvas.height / 2 - 20
    velX = 0

    elapsedTime = 0
    startTime = null

    playing = true

    // initialize game elements
    meteors = []
    goodOnes = []

    // set time out for game elements
    setTimeout(spawnMeteors, 500)
    idGoodOnes = setTimeout(spawnGoodOnes, getRandomInt(10000, 60000))

    // start game loop
    requestAnimationFrame(gameLoop);
}

function stopGame() {
    if (idAnimation) {
        cancelAnimationFrame(idAnimation);
        clearTimeout(idMeteors);
        clearTimeout(idGoodOnes);
        if (localStorage.bestTime == undefined || elapsedTime > localStorage.bestTime) localStorage.bestTime = elapsedTime
        // TO DO: END GAME SOUND
        setTimeout(startGame, 3000)
    }
}


function spawnPattern(pattern, patternIndex, direction) {
    // number of meteors in the pattern
    meteorsCount = patternIndex < 8 ? pattern.length : 5
    // gets a valid ramdom Y position for the first meteor of the pattern
    randomY = getRandomY(pattern)
    // meteors X-axis offset
    var offsetX = patternIndex < 8 ? 0 : 300

    for (var i = 0; i < meteorsCount; i++) {
        if (patternIndex == 2 && (i == 2 || i == 3))
            offsetX = -50
        else if (patternIndex == 2 &&  (i == 4 || i == 5))
            offsetX = -100
        else if (patternIndex == 3) 
            offsetX = (-1) * i * (METEOR_SIZE + METEOR_SIZE / 4)
        else if (patternIndex == 4)
            offsetX = (-1) * i * (METEOR_SIZE + METEOR_SIZE / 2)
        else if (patternIndex > 7 )
            offsetX -= 300
        else offsetX = 0

        var meteorY = patternIndex < 8 ? randomY + pattern[i] : getRandomInt(WALL_TOP, wallBottom - METEOR_SIZE)

        meteors.push({ x: direction == 1 ? offsetX : canvas.width - offsetX, y: meteorY, velX: direction == 1 ? 10 : -10, size: METEOR_SIZE })
    }

    if (getRandomInt(1, 2) == 1) {
        direction = direction == 1 ? 2 : 1
        offsetX = patternIndex < 9 ? 0 : 300

        for (var i = 0; i < meteorsCount; i++) {
            if (patternIndex == 2 && (i == 2 || i == 3))
                offsetX = -50
            else if (patternIndex == 2 && (i == 4 || i == 5))
                offsetX = -100
            else if (patternIndex == 3)
                offsetX = (-1) * i * (METEOR_SIZE + METEOR_SIZE / 4)
            else if (patternIndex == 4)
                offsetX = (-1) * i * (METEOR_SIZE + METEOR_SIZE / 2)
            else if (patternIndex >= 9)
                offsetX -= 300
            else offsetX = 0

            var meteorY = patternIndex < 9 ? randomY + pattern[i] : getRandomInt(WALL_TOP, wallBottom - METEOR_SIZE)

            meteors.push({ x: direction == 1 ? offsetX : canvas.width - offsetX, y: meteorY , velX: direction == 1 ? 10 : -10, size: METEOR_SIZE })
        }
    }
}

function spawnMeteors() {
    // get random initial direction
    var randomDirection = getRandomInt(1, 2) // 1 == meteors go rightwards, 2 == meteors go leftwards

    // spawn sprites
    var curPattern = getRandomInt(1, 11) 
    switch (curPattern) {
        case 1:
            spawnPattern(PATTERN1, curPattern, randomDirection)           
            break;
        case 2:
            spawnPattern(PATTERN2, curPattern, randomDirection)            
            break;
        case 3:
            spawnPattern(PATTERN3, curPattern, randomDirection)           
            break;
        case 4:
            spawnPattern(PATTERN4, curPattern, randomDirection)            
            break;
        case 5:
            spawnPattern(PATTERN5, curPattern, randomDirection)          
            break;
        case 6:
            spawnPattern(PATTERN6, curPattern, randomDirection)
            break;
        case 7:
            spawnPattern(PATTERN7, curPattern, randomDirection)
            break;
        case 8:
            spawnPattern(PATTERN8, curPattern, randomDirection)
            break;
        case 9: 
        case 10:
        case 11:
            spawnPattern(null, curPattern, randomDirection)        
            break;
    }
    // console.log("meteors count " + meteors.length)
    idMeteors = setTimeout(spawnMeteors, curPattern < 8 ? getRandomInt(500, 2000) : 6500)
    
}

function spawnGoodOnes() {

    var randomX = getRandomInt(0, canvas.width - METEOR_SIZE)
    var randomY = getRandomInt(WALL_TOP + 1, wallBottom - METEOR_SIZE)
    goodOnes.push({ x: randomX, y: randomY, size: METEOR_SIZE })
    
    idGoodOnes = setTimeout(spawnGoodOnes, getRandomInt(10000, 60000))    
}

function spawnStar() 
{
    var velX = Math.random() * 2 + 0.1 
    var velY = Math.random() * 2 + 0.1
    stars.push({ x: canvas.width / 2, y: canvas.height / 2, size: 1, velX: getRandomInt(1, 2) == 1 ? velX : (-1) * velX, velY: getRandomInt(1, 2) == 1 ? velY : (-1) * velY })
    //console.log(stars.length)
}

function gameLoop(timestamp) 
{
    if (startTime == null) startTime = timestamp;
    elapsedTime += timestamp - startTime
  
    startTime = timestamp;


    clear()
    update(timestamp)
    draw()
    
    idAnimation = requestAnimationFrame(gameLoop);

    if (!playing)
        stopGame()
}


function checkCollisions() {
    // resolve wall collisions
    if (posX < 0) {
        posX = canvas.width - 40 // Math.abs(posX)
    }
    else if (canvas.width - posX < 40) {
        posX = 0
    }

    // collision with good ones (FIRST)
    for (i = goodOnes.length - 1; i >= 0 ; i--) {
        if (intersects(posX, posY, SPRITE_WIDTH, SPRITE_HEIGHT, goodOnes[i].x, goodOnes[i].y, goodOnes[i].size, goodOnes[i].size)) {
            goodOnes.splice(i, 1)
            meteors.length = 0 // meteors = [] // TO DO: EXPLOSION SPRITES AND EXPLOSION SOUND
            clearTimeout(idMeteors);
            idMeteors = setTimeout(spawnMeteors, 500) // spawnMeteors()
        }
    }

    // collision with meteors (then)
    for (i = 0; i < meteors.length; i++) {
        if (intersects(posX, posY, SPRITE_WIDTH, SPRITE_HEIGHT, meteors[i].x, meteors[i].y, meteors[i].size, meteors[i].size)) {
            //console.log("oops")
            playing = false
        }
    }
    
}

function getVelY()
{
    if (direction == "down" && posY + SPRITE_HEIGHT > wallBottom)
    {
        direction = "up"
        return (-1) * 16 // (wallBottom - posY) / 20
    }
    else if (direction =="up" && posY < WALL_TOP +20)
    {
        direction = "down"
        return (-1) * 16 // (posY / 20)
    }
    else if (direction == "down" && posY > wallBottom - SPRITE_HEIGHT * 2)
        return 10 // wallBottom - posY 
    //else if (direction == "down" && posY > // (3 * (wallBottom - WALL_TOP)) / 4)
    //    return 20 // (posY / 20) // VEL_Y
    else if (direction == "down")
        return 16
    else if (direction == "up" && posY < WALL_TOP + SPRITE_HEIGHT) // posY < (wallBottom - WALL_TOP) / 4)
        return (-1) * 10 // posY //  ((wallBottom - posY) / 20)
    //else if (direction == "up" && posY > (3* (wallBottom - WALL_TOP)) / 4)
    //    return (-1) * 20 // (posY / 20) // VEL_Y
    else if (direction == "up")
        return (-1) * 16

}

function clear()
{
    ctx.clearRect(posX, posY, 40, 40)
    for (var i=0; i<meteors.length; i++)
    {
        ctx.clearRect(meteors[i].x, meteors[i].y, meteors[i].size, meteors[i].size)
    }
}

function update()
{
    posX += velX
    posY += getVelY()

    spawnStar()

    for (var i = meteors.length - 1; i >= 0; i--) {       
        meteors[i].x += meteors[i].velX 
        if (meteors[i].velX < 0 && meteors[i].x < 0 || meteors[i].velX > 0 && meteors[i].x > canvas.width) 
            meteors.splice(i, 1)    // remove meteor from array if it is no longer in the game screen
    }

    for (var i = stars.length - 1; i >= 0; i--) {
        stars[i].x += stars[i].velX
        stars[i].y += stars[i].velY
        if (stars[i].x < 0 || stars[i].x > canvas.width || stars[i].y < 0 || stars[i].y > canvas.height) {
            stars.splice(i, 1)    // remove star from array if it is no longer in the game screen
        }
    }

    checkCollisions()

}



function draw()
{
    var color = HSVtoRGB(hsv)

    // draws background
    ctx.save()
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore()

    // draws walls 
    ctx.fillStyle = "white"
    ctx.fillRect(0, WALL_TOP - WALL_HEIGHT, canvas.width, WALL_HEIGHT);
    ctx.fillRect(0, wallBottom, canvas.width, WALL_HEIGHT);
    

    // draws main sprite 
    ctx.fillRect(posX, posY, SPRITE_WIDTH, SPRITE_HEIGHT);

    ctx.save()
    ctx.fillStyle = "black"
    if (posY < (wallBottom - WALL_TOP) / 2)
        ctx.fillRect(posX + 10, posY, SPRITE_WIDTH - 20, SPRITE_HEIGHT - SPRITE_HEIGHT / 2);
    else
        ctx.fillRect(posX + 10, posY + 50, SPRITE_WIDTH - 20, SPRITE_HEIGHT - SPRITE_HEIGHT / 2);
    ctx.restore()
    
    
    // draws meteors 
    ctx.strokeStyle = '#' + toHex(color.r) + toHex(color.g) + toHex(color.b)

    for (var i = 0; i < meteors.length; i++) {
        ctx.save()
        ctx.translate(meteors[i].x + meteors[i].size / 2, meteors[i].y + meteors[i].size / 2);
        ctx.rotate(rotationAngle * Math.PI / 180);
        ctx.strokeRect((-1) * meteors[i].size / 2, (-1) * meteors[i].size / 2, meteors[i].size, meteors[i].size)
        ctx.restore()      
    }

    // draws good ones
    for (var i = 0; i < goodOnes.length; i++) {
        ctx.save()
        ctx.translate(goodOnes[i].x + goodOnes[i].size / 2, goodOnes[i].y + goodOnes[i].size / 2);
        ctx.rotate(rotationAngle * Math.PI / 180);
        ctx.fillStyle = '#' + toHex(color.r) + toHex(color.g) + toHex(color.b)
        ctx.fillRect((-1) * goodOnes[i].size / 2, (-1) * goodOnes[i].size / 2, goodOnes[i].size, goodOnes[i].size)        
        ctx.restore()
    }

    // draw stars
    for (var i = 0; i < stars.length; i++) {
        ctx.save()
        ctx.fillStyle = '#' + toHex(color.r) + toHex(color.g) + toHex(color.b)
        ctx.fillRect(stars[i].x, stars[i].y, stars[i].size, stars[i].size)
        ctx.restore()
        

    }
    // draws counters 
    ctx.font = "70px sans serif";
    ctx.fillText("Current time: " + toTime(elapsedTime), canvas.width / 10, 62);
    ctx.fillText("Best time: " + toTime(localStorage.bestTime != undefined ? (localStorage.bestTime > elapsedTime ? localStorage.bestTime : elapsedTime) : 0), 6 * canvas.width / 10, 62);

    // draws messages
    ctx.font = "40px sans serif";
    ctx.fillText("Use the left and right arrow keys to play -- press space to hide or show the mouse cursor, ENJOY!", canvas.width / 12, wallBottom + 70);

    // changes color
    hsv.h += 0.00033
    //console.log(hsv)
    
    // changes rotation angle
    rotationAngle = (rotationAngle + 1) % 180
}