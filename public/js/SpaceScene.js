class SpaceScene extends Phaser.Scene{
    constructor(){
      super("SpaceScene");
      this.ship;
      this.LaserGroup;
    }
    preload() {
      this.load.image('ship', 'assets/spaceShips_001.png');
      this.load.image('otherPlayer', 'assets/enemyBlack5.png');
      this.load.image('star', 'assets/star_gold.png');
      this.load.image('laser_blue', 'assets/laser_blue.png');
      this.load.image('laser_red', 'assets/laser_red.png');
      this.load.spritesheet('explosion', 'assets/explosion.png', { frameWidth: 32, frameHeight: 32 });

    }
  
    create() {
      this.socket = io();
      this.otherPlayers = this.physics.add.group();
      this.blueLaserGroup = new LaserGroup(this, 'laser_blue');
      this.redLaserGroup = new LaserGroup(this, 'laser_red');
      this.redShipGroup = this.physics.add.group();
      this.blueShipGroup = this.physics.add.group();
  
      this.physics.add.overlap(this.blueLaserGroup, this.redShipGroup, this.hitShip, null, this);
      this.physics.add.overlap(this.redLaserGroup, this.blueShipGroup, this.hitShip, null, this);
      this.projectiles = {};
      this.otherProjectiles = {};
      this.addInputEvents();
      this.socketEvents();
      this.cursors = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
    this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
    this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });

    this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: 0,
        hideOnComplete: true
      });
      
    
    }
  
    hitShip(laser, ship){
  
      this.socket.emit("hitShip", {laser, ship});
      laser.destroy();
      ship.destroy();
      let explosion = this.add.sprite(ship.x, ship.y, 'explosion');
      explosion.setScale(2);
    explosion.play('explode');
  
      if(ship == this.ship) {
        //this.scene.start('GameOverScene');
        this.ship = null;
      }
    }
  
    shootLaser(){
      
      if (this.ship.team === 'blue') {
        this.blueLaserGroup.fireLaser(this.ship.x, this.ship.y, this.ship.rotation, this.ship.team);
      } else {
        this.redLaserGroup.fireLaser(this.ship.x, this.ship.y, this.ship.rotation, this.ship.team);
      }
    }
  
    addInputEvents() {
      var self = this;
      this.input.on('pointerdown', pointer => {
        this.shootLaser();
        const data = {x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation, team: this.ship.team};
        this.socket.emit('projectileFired', data)
      });
      };
  
    socketEvents(){
  
      var self = this;
  
      this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
          if (players[id].playerId === self.socket.id) {
            self.addPlayer(self, players[id]);
          } else {
            self.addOtherPlayers(self, players[id]);
          }
        });
      });
  
      this.socket.on('disconnection', function (playerId) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
          if (playerId === otherPlayer.playerId) {
            otherPlayer.destroy();
          }
        });
      });
  
      this.socket.on('playerMoved', function (playerInfo) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
          if (playerInfo.playerId === otherPlayer.playerId) {
            otherPlayer.setRotation(playerInfo.rotation);
            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
          }
        });
      })
  
      this.socket.on('newPlayer', function (playerInfo) {
        
        self.addOtherPlayers(self , playerInfo);
      });
  
      this.socket.on('scoreUpdate', function (scores) {
        self.blueScoreText.setText('Blue: ' + scores.blue);
        self.redScoreText.setText('Red: ' + scores.red);
      });
      this.socket.on('starLocation', function (starLocation) {
        if (self.star) self.star.destroy();
        self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
        self.physics.add.overlap(self.ship, self.star, function () {
          this.socket.emit('starCollected');
        }, null, self);
      });
  
      this.socket.on('projectileFired', function (data) {
        
        if (data.team === 'blue') {
          self.blueLaserGroup.fireLaser(data.x, data.y, data.rotation, data.team);
        } else {
          self.redLaserGroup.fireLaser(data.x, data.y, data.rotation, data.team);
        }
      });
  
      this.socket.on('hitShip', (data) => {
  
        this.hitShip(data.laser, data.ship);
      })
    }
  
    update() {
      
      if (this.ship) {
        if (this.cursors.left.isDown) {
          this.ship.setAngularVelocity(-250);
        } else if (this.cursors.right.isDown) {
          this.ship.setAngularVelocity(250);
        } else {
          this.ship.setAngularVelocity(0);
        }
      
        if (this.cursors.up.isDown) {
          this.physics.velocityFromRotation(this.ship.rotation + 1.5, 600, this.ship.body.acceleration);
        } else if(this.cursors.down.isDown){
          this.physics.velocityFromRotation(this.ship.rotation + 1.5, -600, this.ship.body.acceleration);
        } else {
          this.ship.setAcceleration(0);
        }
  
         // Additional control: limit sideways velocity
        const velocity = new Phaser.Math.Vector2(this.ship.body.velocity);
        const angle = velocity.angle();
        const speed = velocity.length();
        const maxSidewaysSpeed = 600; // Change this value to limit the sideways speed
        const sidewaysSpeed = Phaser.Math.Wrap(speed * Math.sin(angle - this.ship.rotation + 1.5), -maxSidewaysSpeed, maxSidewaysSpeed);
        const forwardSpeed = speed * Math.cos(angle - this.ship.rotation + 1.5);
        const newVelocity = new Phaser.Math.Vector2(forwardSpeed, sidewaysSpeed).setAngle(this.ship.rotation + 1.5);
        this.ship.setVelocity(newVelocity.x, newVelocity.y);
        
        this.physics.world.wrap(this.ship, 5);
  
        // emit player movement
        var x = this.ship.x;
        var y = this.ship.y;
        var r = this.ship.rotation;
        if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
          this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
        }
        // save old position data
        this.ship.oldPosition = {
          x: this.ship.x,
          y: this.ship.y,
          rotation: this.ship.rotation
        };
      }
    }
  
    addPlayer(self, playerInfo) {
      self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
      self.ship.team = playerInfo.team
      if (self.ship.team == 'blue') {
        self.ship.setTint(0x0000ff);
        this.blueShipGroup.add(self.ship);
      } else {
        self.ship.setTint(0xff0000);
        this.redShipGroup.add(self.ship);
      }
      self.ship.setDrag(100);
      self.ship.setAngularDrag(150);
      self.ship.setMaxVelocity(350);
    }
  
    addOtherPlayers(self, playerInfo) {
      const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
      if (playerInfo.team === 'blue') {
        otherPlayer.setTint(0x0000ff);
        this.blueShipGroup.add(otherPlayer);
      } else {
        otherPlayer.setTint(0xff0000);
        this.redShipGroup.add(otherPlayer);
      }
      otherPlayer.playerId = playerInfo.playerId;
      self.otherPlayers.add(otherPlayer);
    }
  }