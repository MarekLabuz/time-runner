const mat4Create = require('gl-mat4/create')
const mat4Translate = require('gl-mat4/translate')

import { ProgramInfo, GetPosition, Transformations, Color } from './utils'

class Block {
  transformations: Transformations
  getPosition: GetPosition
  fillColor: [number, number, number, number]

  constructor (transformations: Transformations, getPosition: GetPosition, fillColor: Color) {
    this.transformations = transformations
    this.getPosition = getPosition
    this.fillColor = [fillColor[0] / 255, fillColor[1] / 255, fillColor[2] / 255, 1.0]
  }

  render (
    gl: WebGLRenderingContext,
    programInfo: ProgramInfo,
    positionBuffer: WebGLBuffer | null,
    normalsBuffer: WebGLBuffer | null,
    indicesBuffer: WebGLBuffer | null,
    count: number
  ) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)

    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer)
    gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal)

    const modelViewMatrix = mat4Create()
    mat4Translate(modelViewMatrix, modelViewMatrix, this.getPosition())
    this.transformations(modelViewMatrix)
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix)

    gl.uniform4fv(programInfo.uniformLocations.fillColor, this.fillColor)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0)
  }
}

export class Cuboid extends Block {
  constructor (transformations: Transformations, getPosition: GetPosition, fillColor: Color) {
    super(transformations, getPosition, fillColor)
  }

  static positions = [
    // Front face
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0, 1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, -1.0, -1.0,

    // Top face
    -1.0, 1.0, -1.0,
    -1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0, 1.0,
    -1.0, -1.0, 1.0,

    // Right face
    1.0, -1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    -1.0, 1.0, -1.0,
  ]

  static normals = [
    // Front face
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,

    // Back face
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,

    // Top face
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,

    // Bottom face
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,

    // Right face
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,

    // Left face
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0
  ]

  static indices = [
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
  ]

  static positionBuffer: WebGLBuffer | null = null
  static normalsBuffer: WebGLBuffer | null = null
  static indicesBuffer: WebGLBuffer | null = null

  static initBuffers (gl: WebGLRenderingContext) {
    Cuboid.positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, Cuboid.positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Cuboid.positions), gl.STATIC_DRAW)

    Cuboid.normalsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, Cuboid.normalsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Cuboid.normals), gl.STATIC_DRAW)

    Cuboid.indicesBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Cuboid.indicesBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Cuboid.indices), gl.STATIC_DRAW)
  }

  render (gl: WebGLRenderingContext, programInfo: ProgramInfo) {
    super.render(gl, programInfo, Cuboid.positionBuffer, Cuboid.normalsBuffer, Cuboid.indicesBuffer, 36)
  }
}

export class SquareBipyramid extends Block {
  constructor (transformations: Transformations, getPosition: GetPosition, fillColor: Color) {
    super(transformations, getPosition, fillColor)
  }

  static positions = [
    // Front Top face
    0.0, 1.0, 0.0,
    -1.0, 0.0, 1.0,
    1.0, 0.0, 1.0,

    // Right Top face
    0.0, 1.0, 0.0,
    1.0, 0.0, 1.0,
    1.0, 0.0, -1.0,

    // Back Top face
    0.0, 1.0, 0.0,
    1.0, 0.0, -1.0,
    -1.0, 0.0, -1.0,

    // Left Top face
    0.0, 1.0, 0.0,
    -1.0, 0.0, -1.0,
    -1.0, 0.0, 1.0,

    // Front Bottom face
    0.0, -1.0, 0.0,
    -1.0, 0.0, 1.0,
    1.0, 0.0, 1.0,

    // Right Bottom face
    0.0, -1.0, 0.0,
    1.0, 0.0, 1.0,
    1.0, 0.0, -1.0,

    // Back Bottom face
    0.0, -1.0, 0.0,
    1.0, 0.0, -1.0,
    -1.0, 0.0, -1.0,

    // Left Bottom face
    0.0, -1.0, 0.0,
    -1.0, 0.0, -1.0,
    -1.0, 0.0, 1.0
  ]

  static normals = [
    // Front Top face
    0.0, 1.0, 1.0,
    0.0, 1.0, 1.0,
    0.0, 1.0, 1.0,

    // Right Top face
    1.0, 1.0, 0.0,
    1.0, 1.0, 0.0,
    1.0, 1.0, 0.0,

    // Bottom Top face
    0.0, 1.0, -1.0,
    0.0, 1.0, -1.0,
    0.0, 1.0, -1.0,

    // Left Top face
    -1.0, 1.0, 0.0,
    -1.0, 1.0, 0.0,
    -1.0, 1.0, 0.0,

    // Front Bottom face
    0.0, -1.0, 1.0,
    0.0, -1.0, 1.0,
    0.0, -1.0, 1.0,

    // Right Bottom face
    1.0, -1.0, 0.0,
    1.0, -1.0, 0.0,
    1.0, -1.0, 0.0,

    // Bottom Bottom face
    0.0, -1.0, -1.0,
    0.0, -1.0, -1.0,
    0.0, -1.0, -1.0,

    // Left Bottom face
    -1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0
  ]

  static indices = [
    0, 1, 2,
    3, 4, 5,
    6, 7, 8,
    9, 10, 11,
    12, 13, 14,
    15, 16, 17,
    18, 19, 20,
    21, 22, 23
  ]

  static positionBuffer: WebGLBuffer | null = null
  static normalsBuffer: WebGLBuffer | null = null
  static indicesBuffer: WebGLBuffer | null = null

  static initBuffers (gl: WebGLRenderingContext) {
    SquareBipyramid.positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, SquareBipyramid.positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(SquareBipyramid.positions), gl.STATIC_DRAW)

    SquareBipyramid.normalsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, SquareBipyramid.normalsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(SquareBipyramid.normals), gl.STATIC_DRAW)

    SquareBipyramid.indicesBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, SquareBipyramid.indicesBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(SquareBipyramid.indices), gl.STATIC_DRAW)
  }

  render (gl: WebGLRenderingContext, programInfo: ProgramInfo) {
    super.render(gl, programInfo, SquareBipyramid.positionBuffer,
      SquareBipyramid.normalsBuffer, SquareBipyramid.indicesBuffer, 24)
  }
}
