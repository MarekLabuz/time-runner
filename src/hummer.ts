const mat4Translate = require('gl-mat4/translate')
const mat4Scale = require('gl-mat4/scale')

import { Cuboid } from './blocks'
import { ProgramInfo, Position, Direction, HummerSavedState } from './utils'
import TimeMachine from './time-machine'

export default class Hummer {
  position: Position
  gripLeft: Cuboid
  gripRight: Cuboid
  block: Cuboid
  direction: Direction = 1
  fallingSpeed: number = 0
  timeMachine: TimeMachine<HummerSavedState>

  constructor (position: Position) {
    this.position = position

    this.gripLeft = new Cuboid((modelViewMatrix) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [-4.0, 20.0, 0.0])
      mat4Scale(modelViewMatrix, modelViewMatrix, [1.0, 20.0, 1.0])
    }, () => this.position, [50, 50, 50])

    this.gripRight = new Cuboid((modelViewMatrix) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [4.0, 20.0, 0.0])
      mat4Scale(modelViewMatrix, modelViewMatrix, [1.0, 20.0, 1.0])
    }, () => this.position, [50, 50, 50])

    this.block = new Cuboid((modelViewMatrix) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, 4.0, 0.0])
      mat4Scale(modelViewMatrix, modelViewMatrix, [4.0, 4.0, 2.0])
    }, () => this.position, [255, 0, 0])

    this.timeMachine = new TimeMachine<HummerSavedState>(
      () => ({
        direction: this.direction,
        fallingSpeed: this.fallingSpeed
      }),
      lastState => (
        lastState.direction !== this.direction ||
        lastState.fallingSpeed !== this.fallingSpeed
      ),
      (savedState) => {
        this.position[1] += savedState.direction * savedState.fallingSpeed

        this.direction = savedState.direction
        this.fallingSpeed = savedState.fallingSpeed
      }
    )
  }

  update (isTimeFreezed: boolean) {
    this.direction = isTimeFreezed ? 0 : 1

    if (this.direction) {
      if (this.position[1] >= 0 && this.fallingSpeed >= 0) {
        this.fallingSpeed += this.direction * 0.5
      } else if (this.position[1] > 20) {
        this.fallingSpeed = 0
      } else {
        this.fallingSpeed = -1
      }
    }

    this.position[1] -= this.direction * this.fallingSpeed

    this.timeMachine.updateState()
  }

  render (gl: WebGLRenderingContext, programInfo: ProgramInfo) {
    this.gripLeft.render(gl, programInfo)
    this.gripRight.render(gl, programInfo)
    this.block.render(gl, programInfo)
  }
}
