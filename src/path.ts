import Brick from './brick'
import { ProgramInfo, Position, BrickType } from './utils'
import Hero from './hero'

const bombThreshold = -500
const hummerThreshold = -2000
const stickyThreshold = -1000
const iceThreshold = -500
const holeThreshold = -750
const narrowThreshold = -1500

const brickTypes = {
  [BrickType.BOMB]: {
    type: BrickType.BOMB,
    propabilityOfChange: 1.0,
    getTransferableTo: (_: Hero) => [
      BrickType.NORMAL
    ]
  },
  [BrickType.HUMMER]: {
    type: BrickType.HUMMER,
    propabilityOfChange: 1.0,
    getTransferableTo: (_: Hero) => [
      BrickType.NORMAL
    ]
  },
  [BrickType.NORMAL]: {
    type: BrickType.NORMAL,
    propabilityOfChange: 0.1,
    getTransferableTo: (hero: Hero) => [
      hero.position[2] < bombThreshold ? BrickType.BOMB : null,
      hero.position[2] < hummerThreshold ? BrickType.HUMMER : null,
      hero.position[2] < stickyThreshold ? BrickType.STICKY : null,
      hero.position[2] < iceThreshold ? BrickType.ICE : null,
      hero.position[2] < holeThreshold ? BrickType.HOLE : null,
      hero.position[2] < narrowThreshold ? BrickType.NARROW_LEFT : null,
      hero.position[2] < narrowThreshold ? BrickType.NARROW_RIGHT : null
    ]
  },
  [BrickType.NARROW_LEFT]: {
    type: BrickType.NARROW_LEFT,
    propabilityOfChange: 0.5,
    getTransferableTo: (_: Hero) => [BrickType.NORMAL]
  },
  [BrickType.NARROW_RIGHT]: {
    type: BrickType.NARROW_RIGHT,
    propabilityOfChange: 0.5,
    getTransferableTo: (_: Hero) => [BrickType.NORMAL]
  },
  [BrickType.STICKY]: {
    type: BrickType.STICKY,
    propabilityOfChange: 0.3,
    getTransferableTo: (hero: Hero) => [
      BrickType.NORMAL,
      hero.position[2] < holeThreshold ? BrickType.HOLE : null,
      hero.position[2] < narrowThreshold ? BrickType.NARROW_LEFT_STICKY : null,
      hero.position[2] < narrowThreshold ? BrickType.NARROW_RIGHT_STICKY : null
    ]
  },
  [BrickType.NARROW_LEFT_STICKY]: {
    type: BrickType.NARROW_LEFT_STICKY,
    propabilityOfChange: 0.3,
    getTransferableTo: (_: Hero) => [BrickType.STICKY]
  },
  [BrickType.NARROW_RIGHT_STICKY]: {
    type: BrickType.NARROW_RIGHT_STICKY,
    propabilityOfChange: 0.3,
    getTransferableTo: (_: Hero) => [BrickType.STICKY]
  },
  [BrickType.ICE]: {
    type: BrickType.ICE,
    propabilityOfChange: 0.3,
    getTransferableTo: (hero: Hero) => [
      BrickType.NORMAL,
      hero.position[2] < holeThreshold ? BrickType.HOLE : null,
      hero.position[2] < narrowThreshold ? BrickType.NARROW_LEFT_ICE : null,
      hero.position[2] < narrowThreshold ? BrickType.NARROW_RIGHT_ICE : null
    ]
  },
  [BrickType.NARROW_LEFT_ICE]: {
    type: BrickType.NARROW_LEFT_ICE,
    propabilityOfChange: 0.3,
    getTransferableTo: (_: Hero) => [BrickType.ICE]
  },
  [BrickType.NARROW_RIGHT_ICE]: {
    type: BrickType.NARROW_RIGHT_ICE,
    propabilityOfChange: 0.3,
    getTransferableTo: (_: Hero) => [BrickType.ICE]
  },
  [BrickType.HOLE]: {
    type: BrickType.HOLE,
    propabilityOfChange: 1,
    getTransferableTo: (hero: Hero) => [
      BrickType.NORMAL,
      hero.position[2] < iceThreshold ? BrickType.ICE : null,
      hero.position[2] < stickyThreshold ? BrickType.STICKY : null,
      hero.position[2] < -2000 ? BrickType.MOVING : null
    ]
  },
  [BrickType.MOVING]: {
    type: BrickType.MOVING,
    propabilityOfChange: 0.3,
    getTransferableTo: (hero: Hero) => [
      hero.position[2] < holeThreshold ? BrickType.HOLE : null
    ]
  }
}

export default class Path {
  bricks: Brick[]
  state: {
    type: BrickType,
    propabilityOfChange: number,
    getTransferableTo: (hero: Hero) => (BrickType | null)[]
  }

  constructor (bricks: Brick[]) {
    this.bricks = bricks
    this.state = brickTypes[BrickType.NORMAL]
  }

  update (isActive: boolean, head: Position, hero: Hero, isTimeFreezed: boolean) {
    const type = this.state.type
    const pathThreshold = (Math.min((hero.score + 3000) / 3000, 5) * hero.numberOfCollectedTime) + 25
    this.bricks = this.bricks.filter(brick => (brick.position[2] < hero.position[2] + pathThreshold))

    if (isActive && (!this.bricks.length || this.bricks[0].position[2] > head[2])) {
      const newBrick = new Brick(head, type, Math.random() < 0.05)

      if (
        this.bricks.length &&
        type === BrickType.MOVING &&
        this.bricks[0].type === BrickType.MOVING
      ) {
        newBrick.position[0] = this.bricks[0].position[0]
        newBrick.originalPosition[0] = this.bricks[0].originalPosition[0]
        newBrick.direction = this.bricks[0].direction
        newBrick.movingSpeed = this.bricks[0].movingSpeed
      }

      this.bricks = [newBrick, ...this.bricks]
      this.tryToTransfer(hero)
    }

    for (const brick of this.bricks) {
      brick.update(isTimeFreezed)
    }
  }

  runTimeMachine () {
    for (const brick of this.bricks) {
      brick.timeMachine.runTimeMachine()
    }
  }

  tryToTransfer (hero: Hero) {
    if (Math.random() < this.state.propabilityOfChange) {
      const transferableTo = this.state
        .getTransferableTo(hero)
        .filter(v => v) as BrickType[]

      if (!transferableTo.length) return

      const index = Math.floor(transferableTo.length * Math.random())
      const newBrickType = transferableTo[index]
      this.state = brickTypes[newBrickType]
    }
  }

  render (gl: WebGLRenderingContext, programInfo: ProgramInfo) {
    for (const brick of this.bricks) {
      brick.render(gl, programInfo)
    }
  }
}
