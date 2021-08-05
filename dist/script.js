let gameCanvas;
let scene = "menu";
let gamePaused = false;
let playerUnlocked = {
  lunge:true,
  powerBuff:false,
  healthBoost:false,
  regen:0
};
let playerCooldowns = {
  lunge:0,
  powerBuff:0,
  healthBoost:0
};
let playerScore = 0;
let playerCoins = 0;
$("#shop-div").hover(
  function(){
    gamePaused = true;
  }, 
  function(){
    gamePaused = false;
  }
);
let findCost = element => {
  let para = element.previousElementSibling;
  let costSpan = para.getElementsByClassName("item-cost")[0];
  let cost = parseInt(costSpan.textContent);
  return cost;
}
let changeCost = (element, amount) => {
  let currentCost = findCost(element);
  let costSpan = element.previousElementSibling.getElementsByClassName("item-cost")[0];
  costSpan.textContent = currentCost + amount;
}
let maxOut = element => {
  let textSpan = element.previousElementSibling.getElementsByClassName("item-cost-span")[0];
  textSpan.textContent = "Maxed Out";
  textSpan.style.color = "rgb(0, 255, 0)";
  element.style.display = "none";
}
let buttonChanges = btn => {
  let textSpan = btn.previousElementSibling.getElementsByClassName("item-cost-span")[0];
  textSpan.textContent = "Unlocked";
  textSpan.style.color = "rgb(0, 255, 0)";
  btn.style.display = "none";
}
let changeAbilities = {
  powerBuff: btn => {
    if(playerCoins > findCost(btn)) {
      playerUnlocked.powerBuff = true;
      playerCoins -= findCost(btn);
      playerScore += findCost(btn);
      buttonChanges(btn);
      alert("Use the Q key to use this ability.");
    }
  },
  healthBoost: btn => {
    if(playerCoins > findCost(btn)) {
      playerUnlocked.healthBoost = true;
      playerCoins -= findCost(btn);
      playerScore += findCost(btn);
      buttonChanges(btn);
      alert("Use the F key to use this ability.");
    }
  },
  healthRegen: btn => {
    if(playerCoins > findCost(btn)) {
      playerUnlocked.regen += 0.01;
      playerCoins -= findCost(btn);
      playerScore += findCost(btn);
      changeCost(btn, 1000);
      if(findCost(btn) > 5000) {
        maxOut(btn);
      }
    }
  }
};
const gameCode = inst => {
  with(inst) {
    size(800, 800);
    background(0, 0, 0);
    imageMode(CENTER);
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    const numStars = 1000;
    let mouseP = false;
    let keys = [];
    let shift = false;
    let deleted = false;
    const pi = Math.PI;
    const sqrt2 = sqrt(2);
    let tick = 0;
    stroke(255);
    //Uses Basic/Classic central limit theorem:
    //https://en.wikipedia.org/wiki/Central_limit_theorem
    const distr = (samples, min, max) => {
      //The higher the samples, the tighter the bell curve
      let randomNumberSum = 0;
      for(let i = 0; i < samples; i++) {
        randomNumberSum += random(min, max);
      }
      return randomNumberSum/samples;
    }
    const normalDistribution = (samples, min, max, offset) => {
      let retValue;
      while(true) {
        let norm = distr(samples, min, max);
        norm += offset;
        if(norm > min || norm < max) {
          retValue = norm;
          break;
        }
      }
      return retValue;
    }
    for(let i = 0; i < numStars; i++) {
      strokeWeight(random(0, 3));
      point(random(0, 800), random(0, 800));
    }
    const starImg = get(0, 0, 800, 800);
    const showCursor = (x, y) => {
      let r = 20;
      let st = 2;
      stroke(255, 0, 0);
      noFill();
      strokeWeight(st);
      ellipse(x, y, r * 2, r * 2);
      line(x - r + st, y, x + r - st, y);
      line(x, y - r + st, x, y + r - st);
    }
    class Bullet {
      constructor(vel, p) {
        this.position = p.position.get();
        this.velocity = vel.get();
        let startPos = PVector.normalize(this.velocity.get());
        startPos.mult(10);
        this.position.add(startPos);
        this.velocity.normalize();
        this.velocity.mult(10);
        this.powerBuff = p.abilityVars.powerBuff.activated;
        this.dmg = p.weaponObject.damage;
      }
      move() {
        this.position.add(this.velocity);
      }
      display() {
        noStroke();
        fill(70, 102, 255);
        if(this.powerBuff) {
          fill(255, 255, 0);
        }
        ellipse(this.position.x, this.position.y, 10, 10);
      }
      testForHit(bulletArray) {
        let that;
        for(var j = 0; j < bulletArray.length; j++) {
          that = bulletArray[j];
          if(dist(this.position.x, this.position.y, that.position.x, that.position.y) <= 5 + that.radius) {
            return j;
          }
        }
        return -1;
      }
      testForKill() {
        return this.position.x < 0 || this.position.x > 800 || this.position.y < 0 || this.position.y > 800;
      }
    }
    let bullets = [];
    let player = {};
    player.health = 100;
    player.radius = 10;
    player.position = new PVector(400, 400);
    player.velocity = new PVector(0, 0);
    player.coins = 0;
    let mouseVector = new PVector(mouseX, mouseY);
    player.bulDirection = PVector.sub(mouseVector, player.position);
    player.weaponObject = {
      maxCooldown: 10,
      cooldown: 0,
      damage: 15
    };
    player.abilityVars = {
      lunge: {
        cooldown: 0,
        maxCooldown: 150,
        power: 5
      },
      powerBuff: {
        activated:false,
        power:2,
        cooldown:0,
        maxCooldown:1500,
        duration:500
      },
      healthBoost: {
        cooldown:0,
        maxCooldown:2000,
        boost:20
      }
    };
    player.rotation = -pi/2;
    player.force = 0.03;
    player.angSpeed = pi/30;
    player.display = () => {
      pushMatrix();
      translate(player.position.x, player.position.y);
      rotate(player.rotation);
      noStroke();
      fill(120, 120, 120);
      ellipse(0, 0, 20, 20);
      fill(255, 0, 0);
      if(player.abilityVars.powerBuff.activated) {
        fill(255, 255, 0);
      }
      triangle(15, 0, -10, 5, -10, -5);
      popMatrix();
    };
    player.unlockedAb = {
      lunge:true,
      powerBuff:false,
      healthBoost:false
    };
    player.abilities = {
      lunge: function(direction) {
        let lungeVector = PVector.normalize(direction);
        lungeVector.mult(player.abilityVars.lunge.power);
        player.velocity.add(lungeVector);
      },
      powerBuff: function() {
        player.abilityVars.powerBuff.activated = true;
        player.weaponObject.maxCooldown /= player.abilityVars.powerBuff.power;
      },
      healthBoost: function() {
        player.health += player.abilityVars.healthBoost.boost;
      }
    };
    player.move = () => {
      let dir = new PVector(cos(player.rotation), sin(player.rotation));
      dir.mult(player.force);
      mouseVector = new PVector(mouseX, mouseY);
      player.bulDirection = PVector.sub(mouseVector, player.position);
      let opDir = PVector.mult(dir, -1);
      if(keys[119]) {
        player.velocity.add(dir);
      }
      if(keys[115]) {
        player.velocity.add(opDir);
      }
      if(keys[97]) {
        player.rotation -= player.angSpeed;
      }
      if(keys[100]) {
        player.rotation += player.angSpeed;
      }
      if(keys[101] && player.abilityVars.lunge.cooldown < 0 && player.unlockedAb.lunge) {
        player.abilities.lunge(dir.get());
        player.abilityVars.lunge.cooldown = player.abilityVars.lunge.maxCooldown;
      }
      if(keys[113] && player.abilityVars.powerBuff.cooldown < 0 && player.unlockedAb.powerBuff) {
        player.abilities.powerBuff();
        player.abilityVars.powerBuff.cooldown = player.abilityVars.powerBuff.maxCooldown;
      }
      if(keys[102] && player.abilityVars.healthBoost.cooldown < 0 && player.unlockedAb.healthBoost) {
        player.abilities.healthBoost();
        player.abilityVars.healthBoost.cooldown = player.abilityVars.healthBoost.maxCooldown;
      }
      if(shift) {
        player.velocity.mult(0.9);
      }
      if(mouseP && player.weaponObject.cooldown < 0 && mouseButton === LEFT) {
        bullets.push(new Bullet(player.bulDirection, player));
        player.weaponObject.cooldown = player.weaponObject.maxCooldown;
      }
      player.position.add(player.velocity);
      player.position.x = constrain(player.position.x, 8, 792);
      player.position.y = constrain(player.position.y, 8, 792);
    };
    player.bounce = () => {
      let pp = player.position;
      let pv = player.velocity;
      if(pp.x > 790 && pv.x > 0) {
        player.velocity.x *= -0.5;
      }
      if(pp.x < 10 && pv.x < 0) {
        player.velocity.x *= -0.5;
      }
      if(pp.y > 790 && pv.y > 0) {
        player.velocity.y *= -0.5;
      }
      if(pp.y < 10 && pv.y < 0) {
        player.velocity.y *= -0.5;
      }
    };
    player.doAbilities = () => {
      player.health = constrain(player.health, 0, 100);
      let pa = player.abilityVars;
      player.weaponObject.cooldown--;
      pa.lunge.cooldown--;
      pa.powerBuff.cooldown--;
      pa.healthBoost.cooldown--;
      if(pa.powerBuff.cooldown < pa.powerBuff.maxCooldown - pa.powerBuff.duration && pa.powerBuff.activated) {
        pa.powerBuff.activated = false;
        player.weaponObject.maxCooldown *= player.abilityVars.powerBuff.power;
      }
    };
    player.displayBars = () => {
      //Health bar
      rectMode(TOP, LEFT);
      noFill();
      stroke(255, 255, 255);
      rect(10, 10, 200, 20);
      noStroke();
      fill(255, 0, 0);
      rect(10, 10, player.health * 2, 20);
      //Coins
      textSize(30);
      fill(255, 255, 0);
      ellipse(40, 60, 30, 30);
      textAlign(LEFT, CENTER);
      text(player.coins, 60, 60);
      textAlign(CENTER, CENTER);
      fill(0);
      text("¢", 40, 60);
    };
    player.updateAbilities = () => {
      for(prop in playerUnlocked) {
        player.unlockedAb[prop] = playerUnlocked[prop];
      }
      player.coins = playerCoins;
      playerCooldowns = player.abilityVars;
      for(prop in player.abilityVars) {
        if(typeof(player.unlockedAb[prop]) === "boolean") {
           if (player.abilityVars[prop].cooldown <= 0) {
             $("#" + prop + "-display").css("color","rgb(0, 255, 0)").css("font-size","40px").text("Ready");
           }
          if (player.abilityVars[prop].cooldown >= 0) {
             $("#" + prop + "-display").css("color","rgb(255, 255, 255)").css("font-size","16px").text(player.abilityVars[prop].cooldown);
           }
        }
        player.health += player.unlockedAb.regen;
      }
      if (player.health <= 0) {
        playerScore += player.coins;
        playerScore += tick/10;
        playerScore = round(playerScore);
        $("#score").text(playerScore);
        $(".game-screen").remove();
        $(".end-screen").show();
        noLoop();
      }
    };
    player.update = () => {
      player.updateAbilities();
      player.bounce();
      player.move();
      player.display();
      player.doAbilities();
      player.displayBars();
    };
    class Asteroid {
      constructor(radius, position, velocity) {
        while(true) {
          this.position = new PVector(random(0, 800), random(0,800));
          if(PVector.dist(this.position, player.position) > 200) {
            break;
          }
        }
        this.velocity = new PVector(
          random(-0.6, 0.6),
          random(-0.6, 0.6)
        );
        this.radius = normalDistribution(3, 10, 50, -10);
        if(radius !== undefined) {
          this.radius = radius;
          this.position = position;
          this.velocity = velocity;
          this.position.add(PVector.mult(PVector.normalize(this.velocity), this.radius * 0.9));
        }
        this.health = this.radius;
      }
      moveBounce() {
        this.position.add(this.velocity);
        if (this.position.x < this.radius || this.position.x > (800 - this.radius)) {
          this.velocity.x = this.velocity.x * -0.95;
        }
        if (this.position.y < this.radius || this.position.y > (800 - this.radius)) {
          this.velocity.y = this.velocity.y * -0.95;
        }
        this.position.x = constrain(this.position.x, this.radius, 800 - this.radius);
        this.position.y = constrain(this.position.y, this.radius, 800 - this.radius);
      }
      split() {
        return Math.round(this.radius/sqrt2);
      }
      collide(that, p) {
        if(PVector.dist(this.position, that.position) <= this.radius + that.radius) {
          //Collision with another asteroid (that)
          //Vector describing the path from the center of one asteroid to another
          let colVector = PVector.sub(this.position, that.position);
          let bounceVel = this.velocity.mag() + that.velocity.mag();
          let areaTotal = pow(this.radius, 2) + pow(that.radius, 2);
          colVector.normalize();
          this.velocity.add(PVector.mult(colVector, bounceVel * pow(that.radius, 2)/areaTotal));
          that.velocity.add(PVector.mult(colVector, bounceVel * pow(this.radius, 2)/areaTotal * -1));
          this.velocity.limit(10);
          that.velocity.limit(10);
          this.velocity.mult(0.9);
          that.velocity.mult(0.9);
          if(p) {
            player.health = player.health - this.radius;
          }
        }
      }
      display() {
        fill(50,50,50);
        noStroke();
        ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
      } 
    }
    let asteroids = [];
    let updateAsteroids = () => {
      for(let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].moveBounce();
        asteroids[i].display();
        for(var j = 0; j < asteroids.length; j++) {
          if(j !== i) {
            asteroids[i].collide(asteroids[j], false);
          }
        }
        asteroids[i].collide(player, true);
        if(asteroids[i].health <= 0) {
          playerCoins += round(asteroids[i].radius);
          if(asteroids[i].split() > 10) {
            let vel = new PVector(random(0, 1.2), random(0, 1.2));
            asteroids.push(new Asteroid(asteroids[i].split(), asteroids[i].position.get(), vel.get()));
            asteroids.push(new Asteroid(asteroids[i].split(), asteroids[i].position.get(), PVector.mult(vel, -1)));
          }
          asteroids.splice(i, 1);
        }
      }
    }
    //Normal distribution testing [KEEP]
    /*
    background(0, 0, 0);
    noStroke();
    fill(255, 255, 255, 1);
    draw = () => {
      let ndis = normalDistribution(3, 0, 800, -50);
      let d =  2 * (10 + ndis/20);
      ellipse(ndis, 400, d, d);
    }
    */  
    draw = () => {
      if(gamePaused) {
        noLoop();
      }
      tick++;
      background(0, 0, 0);
      image(starImg, 400, 400);
      pushMatrix();
      translate(400, 400);
      popMatrix();
      let moduloAmt = 200 - floor(tick/100);
      moduloAmt = constrain(moduloAmt, 20, 300);
      if(frameCount % moduloAmt === 0) {
        asteroids.push(new Asteroid());
      }
      updateAsteroids();
      for(let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].move();
        bullets[i].display();
        if(bullets[i].testForHit(asteroids) > -1) {
          asteroids[bullets[i].testForHit(asteroids)].health -= player.weaponObject.damage;
          bullets.splice(i, 1);
          deleted = true;
        }
        if(!deleted) {
          if(bullets[i].testForKill()) {
            bullets.splice(i, 1);
          }
        }
        deleted = false;
      }
      player.update();
      showCursor(mouseX, mouseY);
      if(gamePaused) {
        noLoop();
        background(0);
        fill(255);
        textSize(30);
        text("Game Paused", 400, 400);
      }
    };
    keyPressed = () => {
      //println(key.code);
      keys[key.code > 64 && key.code < 91 ? key.code + 32 : key.code] = true;
      if(keyCode === SHIFT) {
        shift = true;
      }
      if(keyCode === 76) {
        playerCoins += 6157;
      }
    };
    keyReleased = () => {
      keys[key.code > 64 && key.code < 91 ? key.code + 32 : key.code] = false;
      if(keyCode === SHIFT) {
        shift = false;
      }
    };
    mousePressed = () => {
      mouseP = true;
    }
    mouseReleased = () => {
      mouseP = false;
    }
    mouseOver = () => {
      loop();
      gamePaused = false;
    }
  }
};
const startGame = () => {
  $(".start-screen").hide();
  let newCanvas = $("<canvas></canvas>").attr("id", "game-canvas");
  newCanvas.appendTo($(document.body));
  newCanvas.addClass("game-screen");
  gameCanvas = document.getElementById("game-canvas");
  $(".game-screen").show();
  const processing = new Processing(gameCanvas, gameCode);
}