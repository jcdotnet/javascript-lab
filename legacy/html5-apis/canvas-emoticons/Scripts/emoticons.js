/*
   Project name: emoticonia
   
   Project description: a simple HTML5 game

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

var SPRITE_SIZE = 64
var MAX_SPRITES = 13

var PROJECTILE_SIZE = 16
var OFFSET_PROJECTILE = 10

var VELOCITIES = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]
var EXPLOSION_START = [[192, 192], [192, 128], [192, 64], [192, 0], [128, 192], [128, 128], [128, 64], [128, 0], [64, 192], [64, 128], [64, 64], [64, 0], [0, 192], [0, 128], [0, 64], [0, 0]]

// canvas and animation
var canvas, ctx, mouse = true
var idAnimation

// game elements

var resources = ['joy.png', 'kiss.png', 'tongue.png', 'ghost.png', 'secret.png', 'embarassed.png', 'relaxed.png', 'blush.png', 'explosion.png', 'smiley.png', 'score.png', 'bee.png', 'space.png']
var images = []

var mainSprite
var beeSprite
var scoreSprite
var sprites = []
var projectiles = []  
var explosions = [] 

// game control
var score
var playing, restart, hint
var canShoot = true

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

    // load images and start the game

    imagesLoaded = 0

    for (var i = 0; i < resources.length; i++) {
        var img = new Image();
        loadImage(img, resources[i])
    }

    $("#myCanvas").css("cursor", "none")


})

function loadImage(img, url)
{
    img.onload = function () {

        imagesLoaded++;
        if (imagesLoaded == resources.length) {
            startGame();
        }
        
    }
    img.src = '/Assets/' + url;
    images.push(img)
}

function handleKeydown(event) {

    if (!playing) return

    if (event.keyCode == 37) // left arrow key
        mainSprite.vel[0] = -4
    if (event.keyCode == 38)  // up arrow key
        mainSprite.vel[1] = -4
    if (event.keyCode == 39)  // right arrow key
        mainSprite.vel[0] = 4
    if (event.keyCode == 40)  // down arrow key
        mainSprite.vel[1] = 4
    if (event.keyCode == 32 && canShoot) // space bar
    {
        projectiles.push({ type: "ours", pos: [mainSprite.pos[0] + (SPRITE_SIZE / 2) - (PROJECTILE_SIZE / 2), mainSprite.pos[1] - OFFSET_PROJECTILE], vel: [0, -5], active: true })
        canShoot = false
    }
    hint = false
}

function handleKeyup(event) {

    if (event.keyCode == 37 || event.keyCode == 39) // left or right arrow key
        mainSprite.vel[0] = 0
    if (event.keyCode == 38 || event.keyCode == 40)  // up or down arrow key
        mainSprite.vel[1] = 0

    canShoot = true
}

function handleResize() {

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    if (scoreSprite != undefined) {
        keepInsideCanvas(scoreSprite)
        scoreSprite.pos[1] = canvas.height - SPRITE_SIZE
    }
    for (i = 0; i < sprites.length; i++)  
        keepInsideCanvas(sprites[i])    
}

/////////////////////// helper functions ///////////////////////////

// returns an integer between min and max (both inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// returns the distance between two points
function distance(x1, y1, x2, y2)
{
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy)
}

// detects rectangles collision
function intersectsR(x1, y1, width1, height1, x2, y2, width2, height2) {
    return (x1 < x2 + width2 &&
            x1 + width1 > x2 &&
            y1 < y2 + height2 &&
            height1 + y1 > y2)
}

// detects circles collision
function intersectsC(x1, y1, radius1, x2, y2, radius2) {
    return (distance(x1, y1, x2, y2) < radius1 + radius2)
}

// gets the side where sprite1 collided with sprite2
function GetCollisionSide(sprite1, sprite2)
{
    if (sprite1.pos[1] > sprite2.pos[1] && sprite1.pos[1] < sprite2.pos[1] + SPRITE_SIZE)  
        return "bottom"     
    //else if (sprite1.pos[1] < sprite2.pos[1] && sprite1.pos[1] < SPRITE_SIZE - sprite2.pos[1]) 
    //    return "top"  
    else if (sprite1.pos[0] < sprite2.pos[0] && sprite1.pos[0] < sprite2.pos[0] + SPRITE_SIZE) 
        return "left"   
    else if (sprite1.pos[0] > sprite2.pos[0] && sprite2.pos[0] < sprite1.pos[0] + SPRITE_SIZE) 
        return "right"
}

// returns true is a sprite located in [posX, posY] intersects with any sprite in our global variable "sprites"
function intersectsWithSprites(posX, posY) {
    for (i = 0; i < sprites.length; i++) {
        if (intersectsC(posX, posY, SPRITE_SIZE / 2, sprites[i].pos[0], sprites[i].pos[1], SPRITE_SIZE / 2))
            return true
    }
    return false
}

// returns true if the sprite passed (x1, y1, width1, height1) is entirely inside the container passed
function isInside(x1, y1, width1, height1, containerX, containerY, width, height) {
    // check this 
    return x1 >= containerX && x1 + y1 >= containerY && x1 + width1 <= width && y1 + height1 <= height
}

// keeps the sprite inside the canvas
function keepInsideCanvas(sprite) {
    if (sprite.pos[0] < 0)
        sprite.pos[0] = 0
    if (sprite.pos[0] > canvas.width - 1 - SPRITE_SIZE)
        sprite.pos[0] = canvas.width - 1 - SPRITE_SIZE
    if (sprite.pos[1] < 0)
        sprite.pos[1] = 0
    if (sprite.pos[1] > canvas.height - 1 - SPRITE_SIZE)
        sprite.pos[1] = canvas.height - 1 - SPRITE_SIZE
}


/////////////// game functions /////////////////////

function startGame() {

    score = 0

    sprites = []
    projectiles = []
    explosions = []

    mainSprite = spawnSprite(resources.length - 1)
    beeSprite = spawnSprite(resources.length - 2)
    scoreSprite = spawnSprite(resources.length - 3)

    for (i = 0; i < MAX_SPRITES; i++)
        sprites.push(spawnSprite(getRandomInt(0, 7)))

    hint = true
    playing = true
    restart = false

    requestAnimationFrame(gameLoop);
  
}

function normalize (vector)
{
    if (Math.abs(vector[0]) < Math.abs(vector[1])) ratio = Math.abs(vector[1])
    else ratio = Math.abs(vector[0])
    return ratio!=0 ? [vector[0] / ratio, vector[1] / ratio] : vector // ¿?        
}

function spawnSprite(imageIndex) {

    if (imageIndex >= resources.length - 2) // invader (main sprite) and bee 
    {
        pos = imageIndex == resources.length - 1 ? [canvas.width / 2 - SPRITE_SIZE / 2, (7 * canvas.height) / 8 - SPRITE_SIZE / 2] : [getRandomInt(0, canvas.width - SPRITE_SIZE), getRandomInt(0, canvas.height - SPRITE_SIZE)]
        vel = [0, 0]
        return { img: images[imageIndex], pos: pos, vel: vel }
    }
    else if (imageIndex == resources.length - 3) // score
    {
        pos = [getRandomInt(0, canvas.width - SPRITE_SIZE), canvas.height - SPRITE_SIZE]
        vel = [1, 0]
        return { img: images[imageIndex], pos: pos, vel: vel }
    }

    pos = [getRandomInt(0, canvas.width - SPRITE_SIZE), getRandomInt(0, canvas.height - SPRITE_SIZE)]
    while (intersectsWithSprites(pos[0], pos[1]) || distance(mainSprite.pos[0], mainSprite.pos[1], pos[0], pos[1]) < 300) {
        pos = [getRandomInt(0, canvas.width - SPRITE_SIZE), getRandomInt(0, canvas.height - SPRITE_SIZE)]
    }
    vel = [VELOCITIES[getRandomInt(0, 9)], VELOCITIES[getRandomInt(0, 9)]]

    return { img: images[imageIndex], pos: pos, vel: vel, points: imageIndex * 10, firingDelay: getRandomInt(10, 300), elapsedShotTime: 0, active: true }

}

function stopGame() {
    if (idAnimation) {
        cancelAnimationFrame(idAnimation);
        if (localStorage.bestScore == undefined || score > localStorage.bestScore) localStorage.bestScore = score
        // TO DO: END GAME SOUND
        setTimeout(startGame, 2000)
    }
}

function gameLoop(timestamp) {

    clear()
    update(timestamp)
    draw()

    idAnimation = requestAnimationFrame(gameLoop);

    if (restart)
        stopGame()
}


function checkCollisions() {

    // mainSprite - canvas - keeps inside 
    keepInsideCanvas(mainSprite)
    
    // scoreSprite - canvas - bounces when collides with the left and right side 
    if (scoreSprite.pos[0] < 0 || scoreSprite.pos[0] > canvas.width - 1 - SPRITE_SIZE)
        scoreSprite.vel[0] *= -1

    // sprites - bounces off each other     
    for (i = 0; i < sprites.length; i++) {
        for (j = 0; j < sprites.length; j++) {
            if (intersectsC(sprites[i].pos[0], sprites[i].pos[1], SPRITE_SIZE / 2, sprites[j].pos[0], sprites[j].pos[1], SPRITE_SIZE / 2)) {     
                // resolve collision
                if (GetCollisionSide(sprites[i], sprites[j]) == "top")
                {
                    if (sprites[i].vel[1] > 0 && sprites[j].vel[1] > 0) {
                        sprites[i].vel = [sprites[i].vel[0], -1 * sprites[i].vel[1]]
                    }
                    else if (sprites[i].vel[1] < 0 && sprites[j].vel[1] < 0) {
                        sprites[j].vel = [sprites[j].vel[0],  -1 * sprites[j].vel[1]]
                    }
                    else {
                        sprites[i].vel = [sprites[i].vel[0], -1 * sprites[i].vel[1]]
                        sprites[j].vel = [sprites[j].vel[0],  -1 * sprites[j].vel[1]]
                    }
                }
                else if (GetCollisionSide(sprites[i], sprites[j]) == "bottom") {
                    if (sprites[i].vel[1] > 0 && sprites[j].vel[1] > 0) {
                        sprites[j].vel = [sprites[j].vel[0], -1 * sprites[j].vel[1]]
                    }
                    else if (sprites[i].vel[1] < 0 && sprites[j].vel[1] < 0) {
                        sprites[i].vel = [sprites[i].vel[0], -1 * sprites[i].vel[1]]
                    }
                    else {
                        sprites[i].vel = [sprites[i].vel[0], -1 * sprites[i].vel[1]]
                        sprites[j].vel = [sprites[j].vel[0], -1 * sprites[j].vel[1]]
                    }
                }
                else if (GetCollisionSide(sprites[i], sprites[j]) == "left")
                {
                    if (sprites[i].vel[0] > 0 && sprites[j].vel[0] > 0) {
                        sprites[i].vel = [-1 * sprites[i].vel[0], sprites[i].vel[1]]
                    }
                    else if (sprites[i].vel[0] < 0 && sprites[j].vel[0] < 0) {
                        sprites[j].vel = [-1 * sprites[j].vel[0], sprites[j].vel[1]]
                    }
                    else {
                        sprites[i].vel = [-1 * sprites[i].vel[0], sprites[i].vel[1]];
                        sprites[j].vel = [-1 * sprites[j].vel[0], sprites[j].vel[1]];
                    }
                }
                else if (GetCollisionSide(sprites[i], sprites[j]) == "right") {
                    if (sprites[i].vel[0] > 0 && sprites[j].vel[0] > 0) {
                        sprites[j].vel = [-1 * sprites[j].vel[0], sprites[j].vel[1]]
                    }
                    else if (sprites[i].vel[0] < 0 && sprites[j].vel[0] < 0) {
                        sprites[i].vel = [-1 * sprites[i].vel[0], sprites[i].vel[1]]
                    }
                    else {
                        sprites[i].vel = [-1 * sprites[i].vel[0], sprites[i].vel[1]];
                        sprites[j].vel = [-1 * sprites[j].vel[0], sprites[j].vel[1]];
                    }
                }
            }
        }
    }
    // sprites - bounces when collides with walls
    for (i = 0; i < sprites.length; i++)
    {
        if (sprites[i].pos[0] < 0 || sprites[i].pos[0] > canvas.width - 1 - SPRITE_SIZE)
            sprites[i].vel[0] *= -1
        /* else*/ if (sprites[i].pos[1] < 0 || sprites[i].pos[1] > canvas.height - 1 - SPRITE_SIZE)
            sprites[i].vel[1] *= -1
    }

    // mainSprite - collision with the bee, lose points, if score = 0 does nothing, just buzzes (sounds: TO DO)
    if (intersectsR(mainSprite.pos[0], mainSprite.pos[1], SPRITE_SIZE, SPRITE_SIZE, beeSprite.pos[0], beeSprite.pos[1], SPRITE_SIZE, SPRITE_SIZE)) {
        if (score > 0) score--
    }

    // resolve collisions with projectiles
    for (i = 0; i < projectiles.length; i++) {
        for (var j = 0; j < sprites.length; j++) {
            if (projectiles[i].type == "ours" && intersectsR(projectiles[i].pos[0], projectiles[i].pos[1], PROJECTILE_SIZE, PROJECTILE_SIZE, sprites[j].pos[0], sprites[j].pos[1], SPRITE_SIZE, SPRITE_SIZE)) {
                score += sprites[j].points
                projectiles[i].active = false
                sprites[j].active = false
                explosions.push({ pos: sprites[j].pos, imagesLeft: 16 })
            }
        }
        if (projectiles[i].type == "theirs" && intersectsR(projectiles[i].pos[0], projectiles[i].pos[1], PROJECTILE_SIZE, PROJECTILE_SIZE, mainSprite.pos[0], mainSprite.pos[1], SPRITE_SIZE, SPRITE_SIZE))
        {
            score = score > 100 ? score -= 100 : 0
            projectiles[i].active = false
        }
    }

    // mainSprite - collision with random sprites, game over
    if (intersectsWithSprites(mainSprite.pos[0], mainSprite.pos[1]))
    {
        playing = false
        explosions.push({ pos: mainSprite.pos, imagesLeft: 16 })
    }
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function update() {

    mainSprite.pos[0] += mainSprite.vel[0]
    mainSprite.pos[1] += mainSprite.vel[1]

    beeSprite.vel = normalize([mainSprite.pos[0] - beeSprite.pos[0], mainSprite.pos[1] - beeSprite.pos[1]]) // target - location 

    beeSprite.pos[0] += beeSprite.vel[0]
    beeSprite.pos[1] += beeSprite.vel[1]

    scoreSprite.pos[0] += scoreSprite.vel[0]
    scoreSprite.pos[1] += scoreSprite.vel[1]

    for (i = 0; i < sprites.length; i++)
    {
        sprites[i].pos[0] += sprites[i].vel[0]
        sprites[i].pos[1] += sprites[i].vel[1]
        sprites[i].elapsedShotTime++
        if (sprites[i].elapsedShotTime > sprites[i].firingDelay)
        {
            sprites[i].elapsedShotTime = 0;
            sprites[i].firingDelay = getRandomInt(10, 300)
            projectiles.push({ type: "theirs", pos: [sprites[i].pos[0] + (SPRITE_SIZE / 2), sprites[i].pos[1] + SPRITE_SIZE + OFFSET_PROJECTILE], vel: [0, 5], active: true })
        }
    }

    for (i = 0; i < projectiles.length; i++)
    {
        projectiles[i].pos[0] += projectiles[i].vel[0]
        projectiles[i].pos[1] += projectiles[i].vel[1]
    }
    
    checkCollisions()

    // sprites - remove if inactive
    for (i = sprites.length - 1; i >= 0 ; i--) {
        if (!sprites[i].active)
            sprites.splice(i, 1)
    }
    // projectiles - remove if inactive or out of the screen
    for (i = projectiles.length - 1; i >= 0 ; i--) {
        if (!projectiles[i].active || projectiles[i].pos[1] < 0 || projectiles[i].pos[1] > canvas.height)
             projectiles.splice(i, 1)
    }
    
    // updates explosions, removes if the animation is finished
    for (i = explosions.length-1; i >= 0; i--) {
        if (explosions[i].imagesLeft > 0) 
            explosions[i].imagesLeft--
        else
            explosions.splice(i, 1)
    }

    // sprites - spawn if necessary
    if (sprites.length < MAX_SPRITES)
        sprites.push(spawnSprite(getRandomInt(0, 7)))  
}



function draw() {

    // draws main sprite 
    if (playing) ctx.drawImage(mainSprite.img, mainSprite.pos[0], mainSprite.pos[1]);

    // draws bee
    ctx.drawImage(beeSprite.img, beeSprite.pos[0], beeSprite.pos[1]);

    // draws emoticons
    for (i = 0; i < sprites.length; i++)
        ctx.drawImage(sprites[i].img, sprites[i].pos[0], sprites[i].pos[1]);

    // draws messages
    ctx.drawImage(scoreSprite.img, scoreSprite.pos[0], scoreSprite.pos[1]);

    ctx.save()
    ctx.fillStyle = "brown"
    ctx.font = "15px sans-serif"
    ctx.fillText("Score: " + score, scoreSprite.pos[0] + SPRITE_SIZE, scoreSprite.pos[1] + 15);
    ctx.fillText("Record: " + (localStorage.bestScore != undefined ? localStorage.bestScore : 0), scoreSprite.pos[0] + SPRITE_SIZE, scoreSprite.pos[1] + (SPRITE_SIZE / 2))
    ctx.font = "9px sans-serif"
    ctx.fillText("I don't own the images used in this game. I found them on the Web", 2 * canvas.width / 5, 10)
    if (hint)
    {
        ctx.font = "20px sans-serif"
        ctx.fillStyle = "purple"
        ctx.fillText("press arrow keys to move, space bar to shoot", mainSprite.pos[0] - 150, mainSprite.pos[1] + SPRITE_SIZE + 10);
    }
    ctx.restore()
    
    // draw projectiles // what if I let the user change the projectile by presing a key? 
    for (i = 0; i < projectiles.length; i++)
    {
      // if (projectiles[i].type == "theirs")
            ctx.drawImage(images[images.length - 4], projectiles[i].pos[0], projectiles[i].pos[1]);
       //else 
       //     ctx.fillRect(projectiles[i].pos[0], projectiles[i].pos[1], PROJECTILE_SIZE, PROJECTILE_SIZE);
    }
    // draws explosions and ends game (if proceed)
    for (i = 0; i < explosions.length; i++) {
        ctx.drawImage(images[images.length - 5], EXPLOSION_START[explosions[i].imagesLeft][0], EXPLOSION_START[explosions[i].imagesLeft][1], 64, 64, explosions[i].pos[0], explosions[i].pos[1], 64, 64);
        if (!playing && explosions[i].imagesLeft == 0) 
            restart = true       
    }
}