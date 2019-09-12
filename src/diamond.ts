const mat4Translate = require('gl-mat4/translate')
const mat4Scale = require('gl-mat4/scale')
const mat4Rotate = require('gl-mat4/rotate')

import { SquareBipyramid } from './blocks'
import { ProgramInfo, Position, Direction, DiamondSavedState } from './utils'
import TimeMachine from './time-machine'

export default class Diamond {
  position: Position
  block: SquareBipyramid
  rotation: number = 0
  direction: Direction = 1
  rotationSpeed = Math.PI / 36
  value: number = 30
  isVisible: boolean = true
  target?: Position
  timeMachine: TimeMachine<DiamondSavedState>

  constructor (position: Position) {
    this.position = position

    this.block = new SquareBipyramid((modelViewMatrix) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, 5.0, 0.0])
      mat4Rotate(modelViewMatrix, modelViewMatrix, this.rotation, [0.0, 1.0, 0.0])
      mat4Scale(modelViewMatrix, modelViewMatrix, [0.75, 1.25, 0.75])
    }, () => this.position, [193, 126, 205])

    this.timeMachine = new TimeMachine<DiamondSavedState>(
      () => ({
        direction: this.direction
      }),
      lastState => lastState.direction !== this.direction,
      (savedState) => {
        this.rotation -= savedState.direction * this.rotationSpeed
        this.direction = savedState.direction
      }
    )
  }

  getValue () {
    const value = this.value
    this.value = 0
    this.isVisible = false
    return value
  }

  update (isTimeFreezed: boolean) {
    this.direction = isTimeFreezed ? 0 : 1
    this.rotation += this.direction * this.rotationSpeed

    this.timeMachine.updateState()
  }

  render (gl: WebGLRenderingContext, programInfo: ProgramInfo) {
    if (this.isVisible) {
      this.block.render(gl, programInfo)
    }
  }
}
