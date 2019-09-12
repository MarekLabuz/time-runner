const mat4Translate = require('gl-mat4/translate')
const mat4Scale = require('gl-mat4/scale')

import { Cuboid } from './blocks'
import { Position, ProgramInfo, Color, BrickType, BrickSavedState } from './utils'
import Diamond from './diamond'
import TimeMachine from './time-machine'
import Hummer from './hummer'

const getPosition = (type: BrickType, position: Position): Position => (
  ((
    type  === BrickType.NARROW_LEFT ||
    type  === BrickType.NARROW_LEFT_STICKY ||
    type  === BrickType.NARROW_LEFT_ICE
  ) && [position[0] - 1.5, position[1], position[2]]) ||
  ((
    type  === BrickType.NARROW_RIGHT ||
    type  === BrickType.NARROW_RIGHT_STICKY ||
    type  === BrickType.NARROW_RIGHT_ICE
  ) && [position[0] + 1.5, position[1], position[2]])
) || [position[0], position[1], position[2]]

export default class Brick {
  originalPosition: Position
  position: Position
  type: BrickType
  direction: -1 | 1 | 0
  initialMovingSpeed = 0.1
  movingSpeed = this.initialMovingSpeed
  block: Cuboid
  hummer?: Hummer
  diamond?: Diamond
  timeMachine: TimeMachine<BrickSavedState>

  constructor (position: Position, type: BrickType, hasDiamond: boolean) {
    this.originalPosition = getPosition(type, position)
    this.position = getPosition(type, position)

    this.type = type
    this.direction = type === BrickType.MOVING ? -1 : 0

    const normalColor: Color = [156, 169, 201]
    const stickyColor: Color = [98, 154, 52]
    const iceColor: Color = [67, 128, 198]
    const bombColor: Color = [230, 230, 0]
    const hummerColor: Color = [255, 0, 0]
    const color = (
      ((
        type === BrickType.STICKY ||
        type === BrickType.NARROW_LEFT_STICKY ||
        type === BrickType.NARROW_RIGHT_STICKY
      ) && stickyColor) ||
      ((
        type === BrickType.ICE ||
        type === BrickType.NARROW_LEFT_ICE ||
        type === BrickType.NARROW_RIGHT_ICE
      ) && iceColor) ||
      ((
        type === BrickType.BOMB
      ) && bombColor) ||
      ((
        type === BrickType.HUMMER
      ) && hummerColor) ||
      normalColor
    )

    const scaleX = (
      (
        type === BrickType.NARROW_LEFT ||
        type === BrickType.NARROW_LEFT_STICKY ||
        type === BrickType.NARROW_LEFT_ICE ||
        type === BrickType.NARROW_RIGHT ||
        type === BrickType.NARROW_RIGHT_STICKY ||
        type === BrickType.NARROW_RIGHT_ICE
      ) && 1.5
    ) || 3.0

    this.block = new Cuboid((modelViewMatrix) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, -1.0, 0.0])
      mat4Scale(modelViewMatrix, modelViewMatrix, [scaleX, 1.0, 3.0])
    }, () => this.position, color)

    if (hasDiamond && type !== BrickType.HOLE) {
      this.diamond = new Diamond(this.position)
    }

    if (type === BrickType.HUMMER) {
      this.hummer = new Hummer([this.position[0], 30, this.position[2]])
    }

    this.timeMachine = new TimeMachine<BrickSavedState>(
      () => ({
        direction: this.direction,
        movingSpeed: this.movingSpeed
      }),
      lastState => (
        lastState.direction !== this.direction ||
        lastState.movingSpeed !== this.movingSpeed
      ),
      (savedState) => {
        this.position[0] -= savedState.direction * savedState.movingSpeed

        this.direction = savedState.direction
        this.movingSpeed = savedState.movingSpeed

        if (this.diamond) {
          this.diamond.timeMachine.runTimeMachine()
        }

        if (this.hummer) {
          this.hummer.timeMachine.runTimeMachine()
        }
      }
    )
  }

  update (isTimeFreezed: boolean) {
    if (this.type === BrickType.MOVING) {
      if (isTimeFreezed) {
        this.movingSpeed = 0
      } else {
        this.movingSpeed = this.initialMovingSpeed
        if (Math.abs(this.position[0] - this.originalPosition[0]) > 5) {
          this.direction *= -1
        }
        this.position[0] += this.direction * this.movingSpeed
      }
    }

    if (this.diamond) {
      this.diamond.update(isTimeFreezed)
    }

    if (this.hummer) {
      this.hummer.update(isTimeFreezed)
    }

    this.timeMachine.updateState()
  }

  render (gl: WebGLRenderingContext, programInfo: ProgramInfo) {
    if (this.type !== BrickType.HOLE) {
      this.block.render(gl, programInfo)
    }

    if (this.diamond) {
      this.diamond.render(gl, programInfo)
    }

    if (this.hummer) {
      this.hummer.render(gl, programInfo)
    }
  }
}
