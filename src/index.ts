const mat4Create = require('gl-mat4/create')
const mat4Perspective = require('gl-mat4/perspective')
const mat4LookAt = require('gl-mat4/lookAt')

import Hero from './hero'
import Diamond from './diamond'
import worldState, { WorldState } from './state'
import { Cuboid, SquareBipyramid } from './blocks'
import { ProgramInfo, BrickType, wait, Context } from './utils'

const hero = new Hero([0.0, 0.0, 0.0])
const maxNumberOfCollectedTime = 300
let grayscaleTimeMachine = 0
let grayscaleFreezeTime = 0
let brightness = 1

const updateTimeBar = (ctx: Context, setTransition: boolean) => {
  ctx.elements.time.style.height = `${hero.numberOfCollectedTime / maxNumberOfCollectedTime * 100}%`
  ctx.elements.time.style.transition = setTransition ? 'all 0.5s' : 'none'
}

const updateScore = (ctx: Context) => {
  hero.score = Math.floor(Math.max(hero.score, -hero.position[2]))
  ctx.elements.score.innerText = `${hero.score}`
}

function revertAnimation () {
  if (hero.currentAnimation) {
    const animationLength = hero.currentAnimation.reduce((acc, curr) => acc + curr.length, 0)
    hero.frameIndex = animationLength - hero.frameIndex - 1
  } else {
    hero.frameIndex = 0
  }
  hero.walkAnimation.reverse()
  hero.jumpAnimation.reverse()
}

function timeMachineLoop (ctx: Context) {
  if (hero.numberOfCollectedTime <= 0) {
    revertAnimation()
    setTimeout(() => loop(ctx), 33)
    return
  }

  const start = Date.now()
  grayscaleTimeMachine += 0.04
  grayscaleTimeMachine = Math.min(grayscaleTimeMachine, 1)
  if (brightness >= 1.05) {
    brightness -= 0.05
  } else if (brightness <= 0.95) {
    brightness += 0.01
  }

  hero.timeMachine.runTimeMachine()
  worldState.runTimeMachine()

  hero.numberOfCollectedTime -= 1
  updateTimeBar(ctx, false)

  const delta = Date.now() - start
  if (hero.isTimeMachineRunning) {
    setTimeout(() => timeMachineLoop(ctx), 16 - delta)
  } else {
    revertAnimation()
    setTimeout(() => loop(ctx), 33 - delta)
  }
}

function loop (ctx: Context) {
  const start = Date.now()
  const brick = worldState.getBrick(hero)

  grayscaleTimeMachine -= 0.04
  grayscaleTimeMachine = Math.max(grayscaleTimeMachine, 0)
  grayscaleFreezeTime -= 0.02
  grayscaleFreezeTime = Math.max(grayscaleFreezeTime, 0)
  if (brightness >= 1.05) {
    brightness -= 0.05
  } else if (brightness <= 0.95) {
    brightness += 0.01
  }

  hero.turningSpeed = 0.5
  hero.externalTurningSpeed = 0
  hero.jumpSpeed = -1.5
  hero.walkingSpeed = -1.0

  hero.walkingSpeed *= Math.min((hero.score + 3000) / 3000, 5)

  if (hero.position[1] <= 0) {
    if (
      ((
        brick.brick.type === BrickType.NARROW_LEFT ||
        brick.brick.type === BrickType.NARROW_LEFT_ICE ||
        brick.brick.type === BrickType.NARROW_RIGHT ||
        brick.brick.type === BrickType.NARROW_RIGHT_ICE
      ) && brick.distanceX > 2.5) ||
      brick.distanceX > 4 ||
      brick.distanceZ > 4
    ) {
      hero.isDead = true
    } else {
      switch (brick.brick.type) {
        case BrickType.ICE:
        case BrickType.NARROW_LEFT_ICE:
        case BrickType.NARROW_RIGHT_ICE:
          hero.externalTurningSpeed = 0.15
          break
        case BrickType.STICKY:
        case BrickType.NARROW_LEFT_STICKY:
        case BrickType.NARROW_RIGHT_STICKY:
          hero.walkingSpeed *= 0.5
          hero.turningSpeed = 0.1
          hero.jumpSpeed = -1.2
          break
        case BrickType.MOVING:
          hero.externalDirection = brick.brick.direction
          hero.externalTurningSpeed = brick.brick.movingSpeed
          break
        case BrickType.HUMMER:
          if (brick.brick.hummer && brick.brick.hummer.position[1] < 8) {
            brightness = 0.0
          }
          break
        case BrickType.BOMB:
          brightness *= 2.0
          hero.fallingSpeed = 1.5 * hero.jumpSpeed
          break
      }

      if (brick.brick.diamond) {
        const value = brick.brick.diamond.getValue()
        if (value) {
          brightness *= 1.5
          hero.numberOfCollectedTime += value
          hero.numberOfCollectedTime = Math.min(hero.numberOfCollectedTime, maxNumberOfCollectedTime)
        }
      }
    }
  }

  if (hero.isDead) {
    hero.fallingSpeed = Math.max(hero.fallingSpeed, 0)
  }

  hero.externalTurn()
  hero.jump()
  hero.walk()
  hero.turn()
  hero.animate(1)

  worldState.update(hero, grayscaleFreezeTime > 0)
  worldState.tryToTransfer()

  hero.timeMachine.updateState()

  updateTimeBar(ctx, true)
  updateScore(ctx)

  if (hero.position[1] < -200) {
    ctx.elements.finalScore.innerText = `Your score: ${hero.score}`
    ctx.actions.setShadowOpacity(1)
    ctx.actions.setPlayAgainOpacity(1)
    return
  }

  const delta = Date.now() - start
  if (hero.isTimeMachineRunning && hero.numberOfCollectedTime > 0) {
    revertAnimation()
    setTimeout(() => timeMachineLoop(ctx), 33 - delta)
  } else {
    setTimeout(() => loop(ctx), 33 - delta)
  }
}

const vertexShaderSource = `
  precision mediump float;

  attribute vec4 aVertexPosition;
  attribute vec3 aVertexNormal;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uCameraView;
  uniform vec3 uCameraPosition;
  uniform vec3 uLightPosition;

  varying vec3 vVertexNormal;
  varying vec3 vSurfaceWorldPosition;

  void main() {
    gl_Position = uProjectionMatrix * uCameraView * uModelViewMatrix * aVertexPosition;

    vVertexNormal = mat3(uModelViewMatrix) * aVertexNormal;
    vSurfaceWorldPosition = (uModelViewMatrix * aVertexPosition).xyz;
  }
`

const fragmentShaderSource = `
  precision mediump float;

  struct Light {
    vec3 position;
    vec3 color;
    float ambient;
    float linear;
    float quadratic;
    float cutOff;
    float outerCutOff;
  };

  uniform Light lights[20];
  uniform int numberOfLights;
  uniform vec4 fillColor;
  uniform vec3 uCameraPosition;
  uniform float uBrightnessFactor;
  uniform float uGrayscaleFactor;

  varying vec3 vVertexNormal;
  varying vec3 vSurfaceWorldPosition;

  void main(void) {
    vec3 result = vec3(0.0, 0.0, 0.0);

    for (int i = 0; i < 20; i += 1) {
      if (i == numberOfLights) break;

      vec3 ambient = lights[i].ambient * lights[i].color;

      vec3 norm = normalize(vVertexNormal);
      vec3 lightDir = normalize(lights[i].position - vSurfaceWorldPosition);
      float diff = max(dot(norm, lightDir), 0.0);
      vec3 diffuse = diff * lights[i].color;

      float specularStrength = 0.5;
      vec3 viewDir = normalize(uCameraPosition - vSurfaceWorldPosition);
      vec3 reflectDir = reflect(-lightDir, norm);
      float spec = max(dot(viewDir, reflectDir), 0.0);
      spec *= spec * spec * spec * spec * spec * spec * spec * spec * spec * spec;
      spec *= spec * spec * spec * spec * spec * spec * spec * spec * spec * spec;
      vec3 specular = specularStrength * spec * lights[i].color;

      float distance = length(lights[i].position - vSurfaceWorldPosition);
      float attenuation = 1.0 / (1.0 + lights[i].linear * distance + lights[i].quadratic * (distance * distance));
      ambient *= attenuation * uBrightnessFactor;
      diffuse *= attenuation * uBrightnessFactor;
      specular *= attenuation;

      float theta = dot(lightDir, normalize(-vec3(0.0, -1.0, 0.0)));
      float epsilon = lights[i].cutOff - lights[i].outerCutOff;
      float intensity = clamp((theta - lights[i].outerCutOff) / epsilon, 0.0, 1.0);
      diffuse *= intensity;

      result += (ambient + diffuse) * fillColor.rgb;
    }

    float gray = 0.21 * result.r + 0.71 * result.g + 0.07 * result.b;
	  gl_FragColor = vec4(result.rgb * (1.0 - uGrayscaleFactor) + (gray * uGrayscaleFactor), fillColor.a);
  }
`

function loadShader (gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
    gl.deleteShader(shader)
    return
  }

  return shader
}

function initShaderPrograms (gl: WebGLRenderingContext) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  if (!vertexShader) return

  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  if (!fragmentShader) return

  const shaderProgram = gl.createProgram()
  if (!shaderProgram) return

  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`)
    return
  }

  return shaderProgram
}

function prepareScene (gl: WebGLRenderingContext, programInfo: ProgramInfo) {
  const fieldOfView = 45 * Math.PI / 180
  const canvas = gl.canvas as HTMLCanvasElement
  const aspect = canvas.clientWidth / canvas.clientHeight
  const zNear = 0.1
  const zFar = 500.0

  const projectionMatrix = mat4Create()
  mat4Perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)

  const cameraPosition = [0.0, 35.0, hero.position[2] + 35.0]

  const cameraView = mat4Create()
  mat4LookAt(
    cameraView,
    cameraPosition,
    [0.0, 0.0, hero.position[2] - 20.0],
    [0.0, 1.0, 0.0]
  )

  gl.uniform3fv(programInfo.uniformLocations.cameraPosition, cameraPosition)
  gl.uniformMatrix4fv(programInfo.uniformLocations.cameraView, false, cameraView)
  gl.uniform1f(programInfo.uniformLocations.brightnessFactor, brightness)
  gl.uniform1f(programInfo.uniformLocations.grayscaleFactor, Math.max(grayscaleFreezeTime, grayscaleTimeMachine))

  if (programInfo.type === 'normal') {
    gl.uniform3fv(programInfo.uniformLocations.setLightPosition(0), [0.0, 50.0, hero.position[2] + 20.0])
    gl.uniform3fv(programInfo.uniformLocations.setLightColor(0), [1.0, 1.0, 1.0])
    gl.uniform1f(programInfo.uniformLocations.setLightAmbient(0), 0.0)
    gl.uniform1f(programInfo.uniformLocations.setLightLinear(0), 0.0014)
    gl.uniform1f(programInfo.uniformLocations.setLightQuadratic(0), 0.000007)
    gl.uniform1f(programInfo.uniformLocations.setLightCutOff(0), 0.5)
    gl.uniform1f(programInfo.uniformLocations.setLightOuterCutOff(0), 0.4)

    const diamonds = WorldState.paths
      .reduce((acc, path) => [
        ...acc,
        ...path.bricks.map(brick => brick.diamond as Diamond).filter(v => v)
      ], [] as Diamond[])
      .filter(diamond => diamond.isVisible)
      .slice(0, 19)

    gl.uniform1i(programInfo.uniformLocations.numberOfLights, diamonds.length + 1)

    for (let i = 0; i < diamonds.length; i += 1) {
      gl.uniform3fv(
        programInfo.uniformLocations.setLightPosition(i + 1),
        [diamonds[i].position[0], 3.0, diamonds[i].position[2]]
      )
      gl.uniform3fv(programInfo.uniformLocations.setLightColor(i + 1), [193 / 255, 126 / 255, 205 / 255])
      gl.uniform1f(programInfo.uniformLocations.setLightAmbient(i + 1), 1.0)
      gl.uniform1f(programInfo.uniformLocations.setLightLinear(i + 1), 0.045)
      gl.uniform1f(programInfo.uniformLocations.setLightQuadratic(i + 1), 0.0075)
      gl.uniform1f(programInfo.uniformLocations.setLightCutOff(i + 1), 1.0)
      gl.uniform1f(programInfo.uniformLocations.setLightOuterCutOff(i + 1), 0.2)
    }
  }
}

function render (canvas: HTMLCanvasElement, gl: WebGLRenderingContext, programInfo: ProgramInfo) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clearDepth(1.0)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.enable(gl.BLEND)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  gl.useProgram(programInfo.program)
  prepareScene(gl, programInfo)
  worldState.render(gl, programInfo)
  hero.render(gl, programInfo)

  if (hero.position[1] < -200) {
    return
  }

  requestAnimationFrame(() => render(canvas, gl, programInfo))
}

function init () {
  const canvas = document.querySelector('canvas')
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const gl = canvas.getContext('webgl', { premultipliedAlpha: false })
  if (!gl) return

  window.addEventListener('keydown', (e) => {
    if (e.keyCode === 38 &&  hero.currentAnimation !== hero.jumpAnimation && hero.fallingSpeed === 0) {
      hero.frameIndex = 0
      hero.currentAnimation = hero.jumpAnimation
      hero.fallingSpeed = hero.jumpSpeed
    } else if (e.keyCode === 39) {
      hero.externalDirection = 1
      hero.direction = 1
    } else if (e.keyCode === 37) {
      hero.externalDirection = -1
      hero.direction = -1
    } else if (e.keyCode === 32) {
      hero.isTimeMachineRunning = true
    } else if (e.keyCode === 70 && hero.numberOfCollectedTime >= 15) {
      hero.numberOfCollectedTime -= 15
      grayscaleFreezeTime = 1
    }
  })

  window.addEventListener('keyup', (e) => {
    if (e.keyCode === 39) {
      hero.direction = 0
    } else if (e.keyCode === 37) {
      hero.direction = 0
    } else if (e.keyCode === 32) {
      hero.isTimeMachineRunning = false
    }
  })

  const shaderProgram = initShaderPrograms(gl)
  if (!shaderProgram) return

  const programInfo: ProgramInfo = {
    type: 'normal',
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal')
    },
    uniformLocations: {
      cameraView: gl.getUniformLocation(shaderProgram, 'uCameraView'),
      cameraPosition: gl.getUniformLocation(shaderProgram, 'uCameraPosition'),
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      fillColor: gl.getUniformLocation(shaderProgram, 'fillColor'),
      numberOfLights: gl.getUniformLocation(shaderProgram, 'numberOfLights'),
      brightnessFactor: gl.getUniformLocation(shaderProgram, 'uBrightnessFactor'),
      grayscaleFactor: gl.getUniformLocation(shaderProgram, 'uGrayscaleFactor'),
      setLightPosition: (index: number) => gl.getUniformLocation(shaderProgram, `lights[${index}].position`),
      setLightColor: (index: number) => gl.getUniformLocation(shaderProgram, `lights[${index}].color`),
      setLightAmbient: (index: number) => gl.getUniformLocation(shaderProgram, `lights[${index}].ambient`),
      setLightLinear: (index: number) => gl.getUniformLocation(shaderProgram, `lights[${index}].linear`),
      setLightQuadratic: (index: number) => gl.getUniformLocation(shaderProgram, `lights[${index}].quadratic`),
      setLightCutOff: (index: number) => gl.getUniformLocation(shaderProgram, `lights[${index}].cutOff`),
      setLightOuterCutOff: (index: number) => gl.getUniformLocation(shaderProgram, `lights[${index}].outerCutOff`)
    }
  }

  Cuboid.initBuffers(gl)
  SquareBipyramid.initBuffers(gl)

  const shadow = document.querySelector('.shadow') as HTMLElement
  const background = document.querySelector('.background') as HTMLElement
  const menu = document.querySelector('.menu') as HTMLElement
  const controls = document.querySelector('.controls') as HTMLElement
  const newGameButton = document.querySelector('.button.new-game') as HTMLElement
  const time = document.querySelector('.time > div') as HTMLElement
  const playAgain = document.querySelector('.play-again') as HTMLElement
  const score = document.querySelector('.score') as HTMLElement
  const finalScore = document.querySelector('.play-again > span') as HTMLElement

  const setBackgroundOpacity = (opacity: 0 | 1) => background.setAttribute('style', `opacity: ${opacity}`)
  const setControlsOpacity = (opacity: 0 | 1) => controls.setAttribute('style', `opacity: ${opacity}`)
  const setShadowOpacity = (opacity: 0 | 1) => shadow.setAttribute('style', `opacity: ${opacity}`)
  const setMenuOpacity = (opacity: 0 | 1) => menu.setAttribute('style', `opacity: ${opacity}; pointer-events: ${opacity ? 'all' : 'none'}`)
  const setPlayAgainOpacity = (opacity: 0 | 1) => playAgain.setAttribute('style', `opacity: ${opacity}; pointer-events: ${opacity ? 'all' : 'none'}`)

  const ctx: Context = {
    elements: {
      shadow,
      menu,
      controls,
      newGameButton,
      time,
      playAgain,
      score,
      finalScore
    },
    actions: {
      setShadowOpacity,
      setPlayAgainOpacity,
      setMenuOpacity,
      setBackgroundOpacity
    }
  }

  playAgain.addEventListener('click', async () => {
    if (playAgain.style.opacity !== '1') return

    setShadowOpacity(0)
    setPlayAgainOpacity(0)

    hero.reset()
    worldState.reset()

    render(canvas, gl, programInfo)
    loop(ctx)
  })

  newGameButton.addEventListener('click', async () => {
    if (menu.style.opacity !== '1') return

    render(canvas, gl, programInfo)

    setMenuOpacity(0)
    setBackgroundOpacity(0)
    setControlsOpacity(1)
    await wait(6000)

    setControlsOpacity(0)
    setShadowOpacity(0)
    loop(ctx)
  })
}

init()
