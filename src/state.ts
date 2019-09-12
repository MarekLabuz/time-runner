import Path from './path'
import Brick from './brick'
import { ProgramInfo, Position, BrickType } from './utils'
import Hero from './hero'

export class WorldState {
  paths: [number, number, number]
  transferableTo: WorldState[]

  static head: Position = [0, 0, 0]
  static paths = [
    new Path([]),
    new Path(
      new Array(34)
        .fill(0)
        .map((_, i) => new Brick([0, 0, -i * 6], BrickType.NORMAL, false))
    ),
    new Path([])
  ]

  constructor (paths: [number, number, number]) {
    this.paths = paths
    this.transferableTo = []
  }

  getNextState () {
    return this.transferableTo[Math.floor(Math.random() * this.transferableTo.length)]
  }

  update (hero: Hero, isTimeFreezed: boolean) {
    const paths = this.paths
    WorldState.head[2] = Math.floor((hero.position[2] - 200) / 6) * 6
    for (let i = 0; i < WorldState.paths.length; i += 1) {
      WorldState.paths[i].update(!!paths[i], [WorldState.head[0] + 15 * (i - 1),
        WorldState.head[1], WorldState.head[2]], hero, isTimeFreezed)
    }
  }

  runTimeMachine () {
    for (let i = 0; i < WorldState.paths.length; i += 1) {
      WorldState.paths[i].runTimeMachine()
    }
  }

  render (gl: WebGLRenderingContext, programInfo: ProgramInfo) {
    for (const path of WorldState.paths) {
      path.render(gl, programInfo)
    }
  }

  getPaths () {
    return WorldState.paths
  }
}

const worldState100 = new WorldState([1, 0, 0])
const worldState010 = new WorldState([0, 1, 0])
const worldState001 = new WorldState([0, 0, 1])
const worldState110 = new WorldState([1, 1, 0])
const worldState011 = new WorldState([0, 1, 1])
const worldState101 = new WorldState([1, 0, 1])
const worldState111 = new WorldState([1, 1, 1])

worldState100.transferableTo = [
  worldState010,
  worldState110,
  worldState011,
  worldState101,
  worldState111
]

worldState010.transferableTo = [
  worldState100,
  worldState001,
  worldState110,
  worldState011,
  worldState101,
  worldState111
]

worldState001.transferableTo = [
  worldState010,
  worldState110,
  worldState011,
  worldState101,
  worldState111
]

worldState110.transferableTo = [
  worldState100,
  worldState010,
  worldState001,
  worldState011,
  worldState101,
  worldState111
]

worldState011.transferableTo = [
  worldState100,
  worldState010,
  worldState001,
  worldState110,
  worldState101,
  worldState111
]

worldState101.transferableTo = [
  worldState010,
  worldState110,
  worldState011,
  worldState111
]

worldState111.transferableTo = [
  worldState100,
  worldState010,
  worldState001,
  worldState110,
  worldState011,
  worldState101
]

let currentWorldState = worldState010

export default {
  get () {
    return currentWorldState
  },
  tryToTransfer () {
    if (Math.random() < 0.01) {
      currentWorldState = currentWorldState.getNextState()
    }
  },
  update (hero: Hero, isTimeFreezed: boolean) {
    currentWorldState.update(hero, isTimeFreezed)
  },
  runTimeMachine () {
    currentWorldState.runTimeMachine()
  },
  getBrick (hero: Hero) {
    const bricks = WorldState.paths
      .reduce((acc, path) => [
        ...acc,
        ...path.bricks
          .filter(brick => brick.type !== BrickType.HOLE)
          .map(brick => ({
            brick,
            distanceX: Math.abs(brick.position[0] - hero.position[0]),
            distanceZ: Math.abs(brick.position[2] - hero.position[2]),
            distance: Math.sqrt(
              Math.pow(brick.position[0] - hero.position[0], 2) +
              Math.pow(brick.position[2] - hero.position[2], 2)
            )
          }))
      ], [] as { brick: Brick, distanceX: number, distanceZ: number, distance: number }[])
      .sort((a, b) => a.distance - b.distance)

    return bricks[0]
  },
  render (gl: WebGLRenderingContext, programInfo: ProgramInfo) {
    currentWorldState.render(gl, programInfo)
  },
  reset () {
    currentWorldState = worldState010
    WorldState.head = [0, 0, 0]
    WorldState.paths =  [
      new Path([]),
      new Path(
        new Array(34)
          .fill(0)
          .map((_, i) => new Brick([0, 0, -i * 6], BrickType.NORMAL, false))
      ),
      new Path([])
    ]
  }
}
