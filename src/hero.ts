const mat4Translate = require('gl-mat4/translate')
const mat4Scale = require('gl-mat4/scale')

import { Cuboid } from './blocks'
import {
  Position,
  ProgramInfo,
  animation,
  AnimationTransformations,
  Direction,
  Animation,
  HeroSavedState
} from './utils'
import TimeMachine from './time-machine'

export default class Hero {
  position: Position
  fallingSpeed: number = 0
  walkingSpeed: number = -1
  direction: Direction = 0
  turningSpeed: number = 0.5
  externalDirection: Direction = 1
  externalTurningSpeed: number = 0
  jumpSpeed: number = -1.5
  isDead = false
  savedState: HeroSavedState[] = []
  numberOfCollectedTime: number = 0
  timeMachine: TimeMachine<HeroSavedState>
  isTimeMachineRunning: boolean = false
  score: number = 0

  private head: Cuboid
  private body: Cuboid
  private rightArm: Cuboid
  private leftArm: Cuboid
  private leftLeg: Cuboid
  private rightLeg: Cuboid

  private headRotation: [number, number, number] = [0.0, 0.0, 0.0]
  private headPosition: number = 0
  private headAnimationFn?: AnimationTransformations

  private rightArmRotation: [number, number, number] = [0.0, 0.0, 0.0]
  private rightArmPosition: number = 0
  private rightArmAnimationFn?: AnimationTransformations

  private leftArmRotation: [number, number, number] = [0.0, 0.0, 0.0]
  private leftArmPosition: number = 0
  private leftArmAnimationFn?: AnimationTransformations

  private bodyRotation: [number, number, number] = [0.0, 0.0, 0.0]
  private bodyPosition: number = 0
  private bodyAnimationFn?: AnimationTransformations

  private rightLegRotation: [number, number, number] = [0.0, 0.0, 0.0]
  private rightLegPosition: number = 0
  private rightLegAnimationFn?: AnimationTransformations

  private leftLegRotation: [number, number, number] = [0.0, 0.0, 0.0]
  private leftLegPosition: number = 0
  private leftLegAnimationFn?: AnimationTransformations

  currentAnimation?: Animation
  animationDirection: Direction = 1
  walkAnimation: Animation
  jumpAnimation: Animation
  frameIndex = 0

  constructor (position: Position) {
    this.position = position

    this.head = new Cuboid((modelViewMatrix) => {
      if (this.headAnimationFn) {
        this.headAnimationFn(modelViewMatrix, this.headRotation, this.headPosition)
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, 9.0, 0.0])
      mat4Scale(modelViewMatrix, modelViewMatrix, [0.9, 1.0, 0.9])
    }, () => this.position, [255, 205, 148])

    this.body = new Cuboid((modelViewMatrix) => {
      if (this.bodyAnimationFn) {
        this.bodyAnimationFn(modelViewMatrix, this.bodyRotation, this.bodyPosition)
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, 6.0, 0.0])
      mat4Scale(modelViewMatrix, modelViewMatrix, [1.0, 2.0, 1.0])
    }, () => this.position, [76, 166, 76])

    this.rightArm = new Cuboid((modelViewMatrix) => {
      if (this.rightArmAnimationFn) {
        this.rightArmAnimationFn(modelViewMatrix, this.rightArmRotation, this.rightArmPosition)
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [1.4, 6.0, 0.0])
      mat4Scale(modelViewMatrix, modelViewMatrix, [0.4, 1.5, 0.5])
    }, () => this.position, [76, 166, 76])

    this.leftArm = new Cuboid((modelViewMatrix) => {
      if (this.leftArmAnimationFn) {
        this.leftArmAnimationFn(modelViewMatrix, this.leftArmRotation, this.leftArmPosition)
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [-1.4, 6.0, 0.0])
      mat4Scale(modelViewMatrix, modelViewMatrix, [0.4, 1.5, 0.5])
    }, () => this.position, [76, 166, 76])

    this.rightLeg = new Cuboid((modelViewMatrix) => {
      if (this.rightLegAnimationFn) {
        this.rightLegAnimationFn(modelViewMatrix, this.rightLegRotation, this.rightLegPosition)
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.5, 2.0, 0.0])
      mat4Scale(modelViewMatrix, modelViewMatrix, [0.5, 2.0, 0.75])
    }, () => this.position, [127, 58, 70])

    this.leftLeg = new Cuboid((modelViewMatrix) => {
      if (this.leftLegAnimationFn) {
        this.leftLegAnimationFn(modelViewMatrix, this.leftLegRotation, this.leftLegPosition)
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [-0.5, 2.0, 0.0])
      mat4Scale(modelViewMatrix, modelViewMatrix, [0.5, 2.0, 0.75])
    }, () => this.position, [127, 58, 70])

    const resetAll = () => {
      this.headPosition = 0
      this.headRotation = [0.0, 0.0, 0.0]
      this.rightArmRotation = [0.0, 0.0, 0.0]
      this.rightArmPosition = 0
      this.leftArmPosition = 0
      this.leftArmRotation = [0.0, 0.0, 0.0]
      this.bodyRotation = [0.0, 0.0, 0.0]
      this.bodyPosition = 0
      this.rightLegRotation = [0.0, 0.0, 0.0]
      this.rightLegPosition = 0
      this.leftLegRotation = [0.0, 0.0, 0.0]
      this.leftLegPosition = 0
    }

    this.walkAnimation = [
      { length: 1, action: () => {
        resetAll()
        this.rightArmAnimationFn = animation.walking.rightArm
        this.leftArmAnimationFn = animation.walking.leftArm
        this.rightLegAnimationFn = animation.walking.rightLeg
        this.leftLegAnimationFn = animation.walking.leftLeg
      }},
      { length: 5, action: () => {
        this.rightArmRotation[0] += -this.walkingSpeed * this.animationDirection * Math.PI / 24
        this.leftArmRotation[0] -= -this.walkingSpeed * this.animationDirection * Math.PI / 24
        this.rightLegRotation[0] -= -this.walkingSpeed * this.animationDirection * Math.PI / 24
        this.leftLegRotation[0] += -this.walkingSpeed * this.animationDirection * Math.PI / 24
      }},
      { length: 10, action: () => {
        this.rightArmRotation[0] -= -this.walkingSpeed * this.animationDirection * Math.PI / 24
        this.leftArmRotation[0] += -this.walkingSpeed * this.animationDirection * Math.PI / 24
        this.rightLegRotation[0] += -this.walkingSpeed * this.animationDirection * Math.PI / 24
        this.leftLegRotation[0] -= -this.walkingSpeed * this.animationDirection * Math.PI / 24
      }},
      { length: 5, action: () => {
        this.rightArmRotation[0] += -this.walkingSpeed * this.animationDirection * Math.PI / 24
        this.leftArmRotation[0] -= -this.walkingSpeed * this.animationDirection * Math.PI / 24
        this.rightLegRotation[0] -= -this.walkingSpeed * this.animationDirection * Math.PI / 24
        this.leftLegRotation[0] += -this.walkingSpeed * this.animationDirection * Math.PI / 24
      }},
      { length: 1, action: () => {
        resetAll()
        this.rightArmAnimationFn = animation.walking.rightArm
        this.leftArmAnimationFn = animation.walking.leftArm
        this.rightLegAnimationFn = animation.walking.rightLeg
        this.leftLegAnimationFn = animation.walking.leftLeg
      }}
    ]

    this.jumpAnimation = [
      { length: 1, action: () => {
        resetAll()
        this.headAnimationFn = animation.jumping.head
        this.rightArmAnimationFn = animation.jumping.rightArm
        this.leftArmAnimationFn = animation.jumping.leftArm
        this.bodyAnimationFn = animation.jumping.body

        this.rightLegAnimationFn = animation.jumping.rightLeg
        this.leftLegAnimationFn = animation.jumping.leftLeg
      }},
      { length: 3, action: () => {
        this.headRotation[0] -= this.animationDirection * Math.PI / 20
        this.headPosition -= this.animationDirection * 0.8
        this.leftArmRotation[0] -= this.animationDirection * Math.PI / 7
        this.leftArmPosition -= this.animationDirection * 0.8
        this.rightArmRotation[0] -= this.animationDirection * Math.PI / 7
        this.rightArmPosition -= this.animationDirection * 0.8
        this.bodyRotation[0] -= this.animationDirection * Math.PI / 20
        this.bodyPosition -= this.animationDirection * 0.8
        this.rightLegRotation[0] += this.animationDirection * Math.PI / 20
        this.leftLegRotation[0] += this.animationDirection * Math.PI / 20
      }},
      { length: 3, action: () => {
        this.headRotation[0] += this.animationDirection * Math.PI / 20
        this.headPosition += this.animationDirection * 0.8
        this.leftArmRotation[0] += this.animationDirection * Math.PI / 7
        this.leftArmPosition += this.animationDirection * 0.8
        this.rightArmRotation[0] += this.animationDirection * Math.PI / 7
        this.rightArmPosition += this.animationDirection * 0.8
        this.bodyRotation[0] += this.animationDirection * Math.PI / 20
        this.bodyPosition += this.animationDirection * 0.8
        this.rightLegRotation[0] -= this.animationDirection * Math.PI / 20
        this.leftLegRotation[0] -= this.animationDirection * Math.PI / 20
      }},
      { length: 1, action: () => {
        this.rightLegAnimationFn = animation.jumping.rightLeg
        this.leftLegAnimationFn = animation.jumping.leftLeg

        this.rightLegAnimationFn = animation.walking.rightLeg
        this.leftLegAnimationFn = animation.walking.leftLeg
      }},
      { length: 10, action: () => {
        this.leftArmRotation[0] -= this.animationDirection * Math.PI / 36
        this.rightArmRotation[0] += this.animationDirection * Math.PI / 36
        this.rightLegRotation[0] -= this.animationDirection * Math.PI / 54
        this.leftLegRotation[0] += this.animationDirection * Math.PI / 36
      }},
      { length: 10, action: () => {
        this.leftArmRotation[0] += this.animationDirection * Math.PI / 36
        this.rightArmRotation[0] -= this.animationDirection * Math.PI / 36
        this.rightLegRotation[0] += this.animationDirection * Math.PI / 54
        this.leftLegRotation[0] -= this.animationDirection * Math.PI / 36
      }},
      { length: 1, action: () => {
        resetAll()
        this.headAnimationFn = animation.jumping.head
        this.rightArmAnimationFn = animation.jumping.rightArm
        this.leftArmAnimationFn = animation.jumping.leftArm
        this.bodyAnimationFn = animation.jumping.body

        this.rightLegAnimationFn = animation.walking.rightLeg
        this.leftLegAnimationFn = animation.walking.leftLeg
      }}
    ]

    this.frameIndex = 0
    this.currentAnimation = this.walkAnimation

    this.timeMachine = new TimeMachine<HeroSavedState>(
      () => ({
        walkingSpeed: this.walkingSpeed,
        fallingSpeed: this.fallingSpeed,
        direction: this.direction,
        turningSpeed: this.turningSpeed,
        externalDirection: this.externalDirection,
        externalTurningSpeed: this.externalTurningSpeed,
        currentAnimation: this.currentAnimation
      }),
      lastState => (
        lastState.walkingSpeed !== this.walkingSpeed ||
        lastState.fallingSpeed !== this.fallingSpeed ||
        lastState.direction !== this.direction ||
        lastState.turningSpeed !== this.turningSpeed ||
        lastState.externalDirection !== this.externalDirection ||
        lastState.externalTurningSpeed !== this.externalTurningSpeed ||
        lastState.currentAnimation !== this.currentAnimation
      ),
      (savedState) => {
        this.position[0] -= savedState.direction * savedState.turningSpeed
        this.position[0] -= savedState.externalDirection * savedState.externalTurningSpeed
        this.position[1] += savedState.fallingSpeed
        if (this.position[1] < 0 && savedState.fallingSpeed < 0) {
          this.position[1] = 0
        }
        this.position[2] -= savedState.walkingSpeed
        this.isDead = this.position[1] < -5

        this.walkingSpeed = savedState.walkingSpeed
        this.fallingSpeed = savedState.fallingSpeed
        this.direction = 0
        this.turningSpeed = savedState.turningSpeed
        this.externalDirection = savedState.externalDirection
        this.externalTurningSpeed = savedState.externalTurningSpeed

        if (this.currentAnimation !== savedState.currentAnimation) {
          this.frameIndex = 0
          this.currentAnimation = savedState.currentAnimation
        }

        this.animate(-1)
      }
    )
  }

  animate (animationDirection: Direction) {
    this.animationDirection = animationDirection
    let animation = this.currentAnimation
    if (!animation) return

    let sum = 0
    let frame = animation.find((v) => {
      const result = sum <= this.frameIndex && sum + v.length > this.frameIndex
      sum += v.length
      return result
    })

    if (!frame) {
      this.frameIndex = 0
      this.currentAnimation = this.walkAnimation
      animation = this.currentAnimation
      if (!animation) return
      frame = animation[0]
    }

    frame.action()
    this.frameIndex += 1

    if (frame.length === 1) {
      this.animate(animationDirection)
    }
  }

  turn () {
    this.position[0] += this.direction * this.turningSpeed
  }

  externalTurn () {
    this.position[0] += this.externalDirection * this.externalTurningSpeed
  }

  jump () {
    if (this.position[1] <= 0 && !this.isDead && this.fallingSpeed >= 0) {
      this.position[1] = 0
      this.fallingSpeed = 0
    } else {
      this.fallingSpeed += 0.1
      this.position[1] -= this.fallingSpeed
    }
  }

  walk () {
    if (this.isDead) {
      this.walkingSpeed = 0
    }
    this.position[2] += this.walkingSpeed
  }

  render (gl: WebGLRenderingContext, programInfo: ProgramInfo) {
    this.head.render(gl, programInfo)
    this.body.render(gl, programInfo)
    this.rightArm.render(gl, programInfo)
    this.leftArm.render(gl, programInfo)
    this.rightLeg.render(gl, programInfo)
    this.leftLeg.render(gl, programInfo)
  }

  reset () {
    this.position = [0.0, 0.0, 0.0]
    this.fallingSpeed = 0
    this.walkingSpeed = -1
    this.direction = 0
    this.turningSpeed = 0.5
    this.externalDirection = 1
    this.externalTurningSpeed = 0
    this.jumpSpeed = -1.5
    this.isDead = false
    this.savedState = []
    this.numberOfCollectedTime = 0
    this.isTimeMachineRunning = false
    this.score = 0
  }
}
