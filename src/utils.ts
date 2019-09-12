const mat4Translate = require('gl-mat4/translate')
const mat4Rotate = require('gl-mat4/rotate')

export type Context = {
  elements: {
    shadow: HTMLElement
    menu: HTMLElement
    controls: HTMLElement
    newGameButton: HTMLElement
    time: HTMLElement
    playAgain: HTMLElement
    score: HTMLElement
    finalScore: HTMLElement
  },
  actions: {
    setShadowOpacity: (opacity: 0 | 1) => void
    setPlayAgainOpacity: (opacity: 0 | 1) => void
    setMenuOpacity: (opacity: 0 | 1) => void
    setBackgroundOpacity: (opacity: 0 | 1) => void
  }
}

export const SIZE = 800

export type ProgramInfo = {
  type: 'normal',
  program: WebGLProgram
  attribLocations: {
    vertexPosition: number
    vertexNormal: number
  },
  uniformLocations: {
    cameraView: WebGLUniformLocation | null
    cameraPosition: WebGLUniformLocation | null
    projectionMatrix: WebGLUniformLocation | null
    modelViewMatrix: WebGLUniformLocation | null
    fillColor: WebGLUniformLocation | null
    numberOfLights: WebGLUniformLocation | null
    brightnessFactor: WebGLUniformLocation | null
    grayscaleFactor: WebGLUniformLocation | null
    setLightPosition: (index: number) => WebGLUniformLocation | null
    setLightColor: (index: number) => WebGLUniformLocation | null
    setLightAmbient: (index: number) => WebGLUniformLocation | null
    setLightLinear: (index: number) => WebGLUniformLocation | null
    setLightQuadratic: (index: number) => WebGLUniformLocation | null
    setLightCutOff: (index: number) => WebGLUniformLocation | null
    setLightOuterCutOff: (index: number) => WebGLUniformLocation | null
  }
}

export type Position = [number, number, number]
export type Transformations = (modelViewMatrix: any) => void
export type AnimationTransformations = (modelViewMatrix: any, rotation: [number, number, number], position: number) => void
export type GetPosition = () => Position
export type Animation = { length: number, action: () => void }[]
export type Color = [number, number, number]

export enum BrickType {
  HUMMER = 'HUMMER',
  NORMAL = 'NORMAL',
  NARROW_LEFT = 'NARROW_LEFT',
  NARROW_RIGHT = 'NARROW_RIGHT',
  STICKY = 'STICKY',
  NARROW_LEFT_STICKY = 'NARROW_LEFT_STICKY',
  NARROW_RIGHT_STICKY = 'NARROW_RIGHT_STICKY',
  ICE = 'ICE',
  NARROW_LEFT_ICE = 'NARROW_LEFT_ICE',
  NARROW_RIGHT_ICE = 'NARROW_RIGHT_ICE',
  HOLE = 'HOLE',
  MOVING = 'MOVING',
  BOMB = 'BOMB'
}

export type HeroSavedState = {
  walkingSpeed: number
  fallingSpeed: number
  direction: Direction
  turningSpeed: number
  externalDirection: Direction
  externalTurningSpeed: number
  currentAnimation?: Animation
}

export type BrickSavedState = {
  direction: Direction,
  movingSpeed: number
}

export type HummerSavedState = {
  direction: Direction
  fallingSpeed: number
}

export type DiamondSavedState = {
  direction: Direction
}

export type Direction = -1 | 1 | 0

export const animation = {
  walking: {
    rightArm: (modelViewMatrix: any, rotation: [number, number, number], _: number) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, 8.0, 0.0])
      if (rotation[2]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[2], [0.0, 0.0, 1.0])
      }
      if (rotation[1]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0.0, 1.0, 0.0])
      }
      if (rotation[0]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1.0, 0.0, 0.0])
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, -8.0, 0.0])
    },
    leftArm: (modelViewMatrix: any, rotation: [number, number, number], _: number) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, 8.0, 0.0])
      if (rotation[2]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[2], [0.0, 0.0, 1.0])
      }
      if (rotation[1]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0.0, 1.0, 0.0])
      }
      if (rotation[0]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1.0, 0.0, 0.0])
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, -8.0, 0.0])
    },
    rightLeg: (modelViewMatrix: any, rotation: [number, number, number], _: number) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, 4.0, 0.0])
      if (rotation[2]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[2], [0.0, 0.0, 1.0])
      }
      if (rotation[1]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0.0, 1.0, 0.0])
      }
      if (rotation[0]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1.0, 0.0, 0.0])
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, -4.0, 0.0])
    },
    leftLeg: (modelViewMatrix: any, rotation: [number, number, number], _: number) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, 4.0, 0.0])
      if (rotation[2]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[2], [0.0, 0.0, 1.0])
      }
      if (rotation[1]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0.0, 1.0, 0.0])
      }
      if (rotation[0]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1.0, 0.0, 0.0])
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, -4.0, 0.0])
    }
  },
  jumping: {
    head: (modelViewMatrix: any, rotation: [number, number, number], position: number) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, position, 0.0])
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, 8.0, 0.0])
      if (rotation[2]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[2], [0.0, 0.0, 1.0])
      }
      if (rotation[1]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0.0, 1.0, 0.0])
      }
      if (rotation[0]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1.0, 0.0, 0.0])
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, -8.0, 0.0])
    },
    rightArm: (modelViewMatrix: any, rotation: [number, number, number], position: number) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, position, 0.0])
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, 8.0, 0.0])
      if (rotation[2]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[2], [0.0, 0.0, 1.0])
      }
      if (rotation[1]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0.0, 1.0, 0.0])
      }
      if (rotation[0]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1.0, 0.0, 0.0])
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, -8.0, 0.0])
    },
    leftArm: (modelViewMatrix: any, rotation: [number, number, number], position: number) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, position, 0.0])
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, 8.0, 0.0])
      if (rotation[2]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[2], [0.0, 0.0, 1.0])
      }
      if (rotation[1]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0.0, 1.0, 0.0])
      }
      if (rotation[0]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1.0, 0.0, 0.0])
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, -8.0, 0.0])
    },
    body: (modelViewMatrix: any, rotation: [number, number, number], position: number) => {
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, position, 0.0])
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, 8.0, 0.0])
      if (rotation[2]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[2], [0.0, 0.0, 1.0])
      }
      if (rotation[1]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0.0, 1.0, 0.0])
      }
      if (rotation[0]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1.0, 0.0, 0.0])
      }
      mat4Translate(modelViewMatrix, modelViewMatrix, [0.0, -8.0, 0.0])
    },
    rightLeg: (modelViewMatrix: any, rotation: [number, number, number], _: number) => {
      if (rotation[2]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[2], [0.0, 0.0, 1.0])
      }
      if (rotation[1]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0.0, 1.0, 0.0])
      }
      if (rotation[0]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1.0, 0.0, 0.0])
      }
    },
    leftLeg: (modelViewMatrix: any, rotation: [number, number, number], _: number) => {
      if (rotation[2]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[2], [0.0, 0.0, 1.0])
      }
      if (rotation[1]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0.0, 1.0, 0.0])
      }
      if (rotation[0]) {
        mat4Rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1.0, 0.0, 0.0])
      }
    }
  }
}

export const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time))
