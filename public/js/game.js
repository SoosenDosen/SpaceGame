class Laser extends Phaser.Physics.Arcade.Sprite{
    
  constructor(scene, x, y, rotation, team, imageKey){

      super(scene, -100, -100, imageKey);
      this.setRotation(rotation);
      this.team = team;
      

  }

  fire(x, y, rotation,team, imageKey) {
    this.setTexture(imageKey);
    this.body.reset(x, y);
    this.setRotation(rotation);
    this.setActive(true);
    this.setVisible(true);
    // Adjust rotation for velocityFromRotation
    const adjustedRotation = rotation - Phaser.Math.DegToRad(270);
    this.scene.physics.velocityFromRotation(adjustedRotation, 1200, this.body.velocity);
    
}

  preUpdate(time, delta) {

    super.preUpdate(time, delta)

    if(this.y <= 0 || this.y >= this.scene.game.config.height || this.x <= 0 || this.x >= this.scene.game.config.width){
      this.setActive(false)
      this.setVisible(false)
    }
  }
}

class LaserGroup extends Phaser.Physics.Arcade.Group{

  constructor(scene, imageKey) {
    super(scene.physics.world, scene);
    this.key = imageKey
    this.createMultiple({
      classType: Laser,
      frameQuantity: 30,
      active: false,
      visible: false,
      key: this.key
    })

    
    
  }

  fireLaser(x, y, rotation, team){
    
    const laser = this.getFirstDead(false)
    if (laser) {
      laser.fire(x,y, rotation, team, this.key);
    }
  }
}



var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 }
      }
    },
    scene: SpaceScene
  };
  const game = new Phaser.Game(config);
  
  