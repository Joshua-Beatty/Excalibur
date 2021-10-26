import { Color } from "../../../Color";
import { vec, Vector } from "../../../Math/vector";
import { WebGLGraphicsContextInfo } from "../ExcaliburGraphicsContextWebGL";
import { Renderer } from "../renderer";
import { Shader } from "../shader";
import circleVertexSource from './circle-vertex.glsl';
import circleFragmentSource from './circle-fragment.glsl';
import { GraphicsDiagnostics } from "../../GraphicsDiagnostics";

export class CircleRenderer implements Renderer {
  public readonly type = 'circle';
  shader!: Shader;

  private _gl!: WebGLRenderingContext;
  private _info!: WebGLGraphicsContextInfo

  private _vertices!: Float32Array;
  private _buffer!: WebGLBuffer;
  private _vertIndex = 0; // starts at 0
  private _MAX_CIRCLES_PER_DRAW: number = 1000;
  private _circleCount = 0;
  initialize(gl: WebGLRenderingContext, info: WebGLGraphicsContextInfo): void {
    this._gl = gl;
    this._info = info;
    this.shader = new Shader(circleVertexSource, circleFragmentSource);
    this.shader.compile(gl)
    // this.shader.setAttribute('a_position', 3, gl.FLOAT);
    // this.shader.setAttribute('a_uv', 2, gl.FLOAT);
    // this.shader.setAttribute('a_opacity', 1, gl.FLOAT);
    // this.shader.setAttribute('a_color', 4, gl.FLOAT);
    // this.shader.setAttribute('a_strokeColor', 4, gl.FLOAT);
    // this.shader.setAttribute('a_strokeThickness', 1, gl.FLOAT);
    this.shader.setVertexAttributeLayout([
      'a_position',
      'a_uv',
      'a_opacity',
      'a_color',
      'a_strokeColor',
      'a_strokeThickness'
    ]);
    this.shader.addUniformMatrix('u_matrix', info.matrix.data);

    const verticesPerCommand = 6;
    // Initialize VBO
    // https://groups.google.com/forum/#!topic/webgl-dev-list/vMNXSNRAg8M
    this._vertices = new Float32Array(this.shader.vertexAttributeSize * verticesPerCommand * this._MAX_CIRCLES_PER_DRAW);
    this._buffer = gl.createBuffer() ?? new Error("WebGL - Could not create vertex buffer for ImageRenderer");
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.DYNAMIC_DRAW);
  }

  private _isFull() {
    if (this._circleCount >= this._MAX_CIRCLES_PER_DRAW) {
      return true;
    }
    return false;
  }

  draw(pos: Vector, radius: number, color: Color, stroke: Color, strokeThickness: number) {
    if (this._isFull()) {
      this.render();
    }
    this._circleCount++;

    const currentTransform = this._info.transform.current;
    let index = 0;
    let quad = [];
    const topLeft = pos.add(vec(-radius, -radius));
    const topRight = pos.add(vec(radius, -radius));
    const bottomRight = pos.add(vec(radius, radius));
    const bottomLeft = pos.add(vec(-radius, radius));
    quad[index++] = currentTransform.multv([topLeft.x, topLeft.y]);
    quad[index++] = currentTransform.multv([topRight.x, topRight.y]);
    quad[index++] = currentTransform.multv([bottomLeft.x, bottomLeft.y]);
    quad[index++] = currentTransform.multv([bottomLeft.x, bottomLeft.y]);
    quad[index++] = currentTransform.multv([topRight.x, topRight.y]);
    quad[index++] = currentTransform.multv([bottomRight.x, bottomRight.y]);

    const opacity = this._info.state.current.opacity;

    const uvx0 = 0;
    const uvy0 = 0;
    const uvx1 = 1;
    const uvy1 = 1;

    // Quad update
    // (0, 0, z) z-index doesn't work in batch rendering between batches
    this._vertices[this._vertIndex++] = quad[0][0]; // x + 0 * width;
    this._vertices[this._vertIndex++] = quad[0][1]; //y + 0 * height;
    // this._vertices[this._vertIndex++] = 0;
    // UV coords
    this._vertices[this._vertIndex++] = uvx0; // 0;
    this._vertices[this._vertIndex++] = uvy0; // 0;
    // opacity
    this._vertices[this._vertIndex++] = opacity;
    // color
    this._vertices[this._vertIndex++] = color.r / 255;
    this._vertices[this._vertIndex++] = color.g / 255;
    this._vertices[this._vertIndex++] = color.b / 255;
    this._vertices[this._vertIndex++] = color.a;
    // stroke color
    this._vertices[this._vertIndex++] = stroke.r / 255;
    this._vertices[this._vertIndex++] = stroke.g / 255;
    this._vertices[this._vertIndex++] = stroke.b / 255;
    this._vertices[this._vertIndex++] = stroke.a;
    // stroke thickness
    this._vertices[this._vertIndex++] = strokeThickness / (radius);

    // (0, 1)
    this._vertices[this._vertIndex++] = quad[1][0]; // x + 0 * width;
    this._vertices[this._vertIndex++] = quad[1][1]; // y + 1 * height;
    // this._vertices[this._vertIndex++] = 0;
    // UV coords
    this._vertices[this._vertIndex++] = uvx0; // 0;
    this._vertices[this._vertIndex++] = uvy1; // 1;
    // opacity
    this._vertices[this._vertIndex++] = opacity;
    // color
    this._vertices[this._vertIndex++] = color.r / 255;
    this._vertices[this._vertIndex++] = color.g / 255;
    this._vertices[this._vertIndex++] = color.b / 255;
    this._vertices[this._vertIndex++] = color.a;
    // stroke color
    this._vertices[this._vertIndex++] = stroke.r / 255;
    this._vertices[this._vertIndex++] = stroke.g / 255;
    this._vertices[this._vertIndex++] = stroke.b / 255;
    this._vertices[this._vertIndex++] = stroke.a;
    // stroke thickness
    this._vertices[this._vertIndex++] = strokeThickness / (radius);

    // (1, 0)
    this._vertices[this._vertIndex++] = quad[2][0]; // x + 1 * width;
    this._vertices[this._vertIndex++] = quad[2][1]; // y + 0 * height;
    // this._vertices[this._vertIndex++] = 0;

    // UV coords
    this._vertices[this._vertIndex++] = uvx1; //1;
    this._vertices[this._vertIndex++] = uvy0; //0;
    // opacity
    this._vertices[this._vertIndex++] = opacity;
    // color
    this._vertices[this._vertIndex++] = color.r / 255;
    this._vertices[this._vertIndex++] = color.g / 255;
    this._vertices[this._vertIndex++] = color.b / 255;
    this._vertices[this._vertIndex++] = color.a;
    // stroke color
    this._vertices[this._vertIndex++] = stroke.r / 255;
    this._vertices[this._vertIndex++] = stroke.g / 255;
    this._vertices[this._vertIndex++] = stroke.b / 255;
    this._vertices[this._vertIndex++] = stroke.a;
    // stroke thickness
    this._vertices[this._vertIndex++] = strokeThickness / (radius);

    // (1, 0)
    this._vertices[this._vertIndex++] = quad[3][0]; // x + 1 * width;
    this._vertices[this._vertIndex++] = quad[3][1]; // y + 0 * height;
    // this._vertices[this._vertIndex++] = 0;

    // UV coords
    this._vertices[this._vertIndex++] = uvx1; //1;
    this._vertices[this._vertIndex++] = uvy0; //0;
    // opacity
    this._vertices[this._vertIndex++] = opacity;
    // color
    this._vertices[this._vertIndex++] = color.r / 255;
    this._vertices[this._vertIndex++] = color.g / 255;
    this._vertices[this._vertIndex++] = color.b / 255;
    this._vertices[this._vertIndex++] = color.a;
    // stroke color
    this._vertices[this._vertIndex++] = stroke.r / 255;
    this._vertices[this._vertIndex++] = stroke.g / 255;
    this._vertices[this._vertIndex++] = stroke.b / 255;
    this._vertices[this._vertIndex++] = stroke.a;
    // stroke thickness
    this._vertices[this._vertIndex++] = strokeThickness / (radius);

    // (0, 1)
    this._vertices[this._vertIndex++] = quad[4][0]; // x + 0 * width;
    this._vertices[this._vertIndex++] = quad[4][1]; // y + 1 * height
    // this._vertices[this._vertIndex++] = 0;

    // UV coords
    this._vertices[this._vertIndex++] = uvx0; // 0;
    this._vertices[this._vertIndex++] = uvy1; // 1;
    // opacity
    this._vertices[this._vertIndex++] = opacity;
    // color
    this._vertices[this._vertIndex++] = color.r / 255;
    this._vertices[this._vertIndex++] = color.g / 255;
    this._vertices[this._vertIndex++] = color.b / 255;
    this._vertices[this._vertIndex++] = color.a;
    // stroke color
    this._vertices[this._vertIndex++] = stroke.r / 255;
    this._vertices[this._vertIndex++] = stroke.g / 255;
    this._vertices[this._vertIndex++] = stroke.b / 255;
    this._vertices[this._vertIndex++] = stroke.a;
    // stroke thickness
    this._vertices[this._vertIndex++] = strokeThickness / (radius);

    // (1, 1)
    this._vertices[this._vertIndex++] = quad[5][0]; // x + 1 * width;
    this._vertices[this._vertIndex++] = quad[5][1]; // y + 1 * height;
    // this._vertices[this._vertIndex++] = 0;

    // UV coords
    this._vertices[this._vertIndex++] = uvx1; // 1;
    this._vertices[this._vertIndex++] = uvy1; // 1;
    // opacity
    this._vertices[this._vertIndex++] = opacity;
    // color
    this._vertices[this._vertIndex++] = color.r / 255;
    this._vertices[this._vertIndex++] = color.g / 255;
    this._vertices[this._vertIndex++] = color.b / 255;
    this._vertices[this._vertIndex++] = color.a;
    // stroke color
    this._vertices[this._vertIndex++] = stroke.r / 255;
    this._vertices[this._vertIndex++] = stroke.g / 255;
    this._vertices[this._vertIndex++] = stroke.b / 255;
    this._vertices[this._vertIndex++] = stroke.a;
    // stroke thickness
    this._vertices[this._vertIndex++] = strokeThickness / (radius);
    // this.render();
  }

  render(): void {
    const gl = this._gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);

    // Switch to current shader
    this.shader.use();

    // Ship geometry to graphics hardware
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._vertices);

    // Draw all the quads
    gl.drawArrays(gl.TRIANGLES, 0, this._vertIndex / this.shader.vertexAttributeSize);

    // Diags
    GraphicsDiagnostics.DrawRenderer.push(this.constructor.name);
    GraphicsDiagnostics.DrawCallCount++;
    GraphicsDiagnostics.DrawnImagesCount += this._circleCount;

    // Reset
    this._vertIndex = 0;
    this._circleCount = 0;
  }
}