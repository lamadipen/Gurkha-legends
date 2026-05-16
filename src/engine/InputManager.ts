import Phaser from 'phaser'

export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  sprint: boolean
  dodge: boolean
  lightAttack: boolean
  heavyAttackHeld: boolean
  knife: boolean
  shieldBash: boolean
  shieldHeld: boolean
  grenade: boolean
  interact: boolean
  pause: boolean
}

export class InputManager {
  private keys!: {
    w: Phaser.Input.Keyboard.Key
    a: Phaser.Input.Keyboard.Key
    s: Phaser.Input.Keyboard.Key
    d: Phaser.Input.Keyboard.Key
    up: Phaser.Input.Keyboard.Key
    down: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    shift: Phaser.Input.Keyboard.Key
    space: Phaser.Input.Keyboard.Key
    z: Phaser.Input.Keyboard.Key
    x: Phaser.Input.Keyboard.Key
    c: Phaser.Input.Keyboard.Key
    v: Phaser.Input.Keyboard.Key
    b: Phaser.Input.Keyboard.Key
    esc: Phaser.Input.Keyboard.Key
  }

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!
    this.keys = {
      w:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      shift: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      z:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      x:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      c:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      v:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.V),
      b:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.B),
      esc:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    }
  }

  get state(): InputState {
    return {
      up:              this.keys.w.isDown || this.keys.up.isDown,
      down:            this.keys.s.isDown || this.keys.down.isDown,
      left:            this.keys.a.isDown || this.keys.left.isDown,
      right:           this.keys.d.isDown || this.keys.right.isDown,
      sprint:          this.keys.shift.isDown,
      dodge:           Phaser.Input.Keyboard.JustDown(this.keys.space),
      lightAttack:     Phaser.Input.Keyboard.JustDown(this.keys.z),
      heavyAttackHeld: this.keys.z.isDown,
      knife:           Phaser.Input.Keyboard.JustDown(this.keys.x),
      shieldBash:      Phaser.Input.Keyboard.JustDown(this.keys.c),
      shieldHeld:      this.keys.c.isDown,
      grenade:         Phaser.Input.Keyboard.JustDown(this.keys.v),
      interact:        Phaser.Input.Keyboard.JustDown(this.keys.b),
      pause:           Phaser.Input.Keyboard.JustDown(this.keys.esc),
    }
  }
}
