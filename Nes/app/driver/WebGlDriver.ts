///<reference path="IDriver.ts"/>
class WebGlDriver implements IDriver {
    buf8: Uint8ClampedArray;
    buf32: Uint32Array;

    glContext: WebGLRenderingContext;
    texture: WebGLTexture;
    width: number;
    height: number;

    // vertices representing entire viewport as two triangles which make up the whole
    // rectangle, in post-projection/clipspace coordinates
    static VIEWPORT_VERTICES = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        1.0, 1.0]);
    static NUM_VIEWPORT_VERTICES = WebGlDriver.VIEWPORT_VERTICES.length / 2;

    // Texture coordinates corresponding to each viewport vertex
    static VERTEX_TEXTURE_COORDS = new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0]);


    constructor(canvas: HTMLCanvasElement) {
        [this.width, this.height] = [canvas.width, canvas.height];

        this.initWebGl(canvas);

        const buf = new ArrayBuffer(this.width * this.height * 4);
        this.buf8 = new Uint8Array(buf);
        this.buf32 = new Uint32Array(buf);
       
    }

    initWebGl(canvas: HTMLCanvasElement) {
        var contextAttributes = { premultipliedAlpha: true };
        this.glContext = (canvas.getContext('webgl', contextAttributes) ||
            canvas.getContext('experimental-webgl', contextAttributes)) as WebGLRenderingContext;

        if (!this.glContext)
            throw "WebGl is not supported";
          
        // Set clear color to black, fully transparent
        this.glContext.clearColor(0.0, 0.0, 0.0, 0.0);

        var vertexShader = this.createShaderFromSource(this.glContext.VERTEX_SHADER, `
            attribute vec2 aPosition;
            attribute vec2 aTextureCoord;
            
            varying highp vec2 vTextureCoord;
            
            void main() {
                gl_Position = vec4(aPosition, 0, 1);
                vTextureCoord = aTextureCoord;
            }`);

        var fragmentShader = this.createShaderFromSource(this.glContext.FRAGMENT_SHADER, `
            varying highp vec2 vTextureCoord;
            uniform sampler2D uSampler;
            void main() {
                gl_FragColor = texture2D(uSampler, vTextureCoord);
            }`);

        var program = this.createProgram([vertexShader, fragmentShader]);
        this.glContext.useProgram(program);

        var positionAttribute = this.glContext.getAttribLocation(program, "aPosition");
        this.glContext.enableVertexAttribArray(positionAttribute);

        var textureCoordAttribute = this.glContext.getAttribLocation(program, "aTextureCoord");
        this.glContext.enableVertexAttribArray(textureCoordAttribute);

        // Associate the uniform texture sampler with TEXTURE0 slot
        var textureSamplerUniform = this.glContext.getUniformLocation(program, "uSampler");
        this.glContext.uniform1i(textureSamplerUniform, 0);

        // Create a buffer used to represent whole set of viewport vertices
        var vertexBuffer = this.glContext.createBuffer();
        this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, vertexBuffer);
        this.glContext.bufferData(this.glContext.ARRAY_BUFFER, WebGlDriver.VIEWPORT_VERTICES, this.glContext.STATIC_DRAW);
        this.glContext.vertexAttribPointer(positionAttribute, 2, this.glContext.FLOAT, false, 0, 0);

        // Create a buffer used to represent whole set of vertex texture coordinates
        var textureCoordinateBuffer = this.glContext.createBuffer();
        this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, textureCoordinateBuffer);
        this.glContext.bufferData(this.glContext.ARRAY_BUFFER, WebGlDriver.VERTEX_TEXTURE_COORDS, this.glContext.STATIC_DRAW);
        this.glContext.vertexAttribPointer(textureCoordAttribute, 2, this.glContext.FLOAT, false, 0, 0);

        // Note: TEXTURE_MIN_FILTER, TEXTURE_WRAP_S and TEXTURE_WRAP_T parameters need to be set
        //       so we can handle textures whose width and height are not a power of 2.
        this.texture = this.glContext.createTexture();
        this.glContext.bindTexture(this.glContext.TEXTURE_2D, this.texture);
        this.glContext.texParameteri(this.glContext.TEXTURE_2D, this.glContext.TEXTURE_MAG_FILTER, this.glContext.LINEAR);
        this.glContext.texParameteri(this.glContext.TEXTURE_2D, this.glContext.TEXTURE_MIN_FILTER, this.glContext.LINEAR);
        this.glContext.texParameteri(this.glContext.TEXTURE_2D, this.glContext.TEXTURE_WRAP_S, this.glContext.CLAMP_TO_EDGE);
        this.glContext.texParameteri(this.glContext.TEXTURE_2D, this.glContext.TEXTURE_WRAP_T, this.glContext.CLAMP_TO_EDGE);
        this.glContext.bindTexture(this.glContext.TEXTURE_2D, null);

        // Since we're only using one single texture, we just make TEXTURE0 the active one
        // at all times
        this.glContext.activeTexture(this.glContext.TEXTURE0);
        this.glContext.viewport(0, 0, this.width, this.height);
    }


    // Create a shader of specified type, with the specified source, and compile it.
    //     .createShaderFromSource(shaderType, shaderSource)
    //
    // shaderType: Type of shader to create (fragment or vertex shader)
    // shaderSource: Source for shader to create (string)
    createShaderFromSource(shaderType, shaderSource) {
        const shader = this.glContext.createShader(shaderType);
        this.glContext.shaderSource(shader, shaderSource);
        this.glContext.compileShader(shader);

        // Check for errors during compilation
        const status = this.glContext.getShaderParameter(shader, this.glContext.COMPILE_STATUS);
        if (!status) {
            const infoLog = this.glContext.getShaderInfoLog(shader);
            this.glContext.deleteShader(shader);
            throw `Unable to compile '${shaderType}' shader. Error:${infoLog}`;
        }

        return shader;
    }

    // Create a WebGL program attached to the specified shaders.
    //     .createProgram(shaderArray)
    //
    // shaderArray: Array of shaders to attach to program
    createProgram(shaderArray) {
        const newProgram = this.glContext.createProgram();
        for (let shaderIndex = 0; shaderIndex < shaderArray.length; ++shaderIndex)
            this.glContext.attachShader(newProgram, shaderArray[shaderIndex]);

        this.glContext.linkProgram(newProgram);

        // Check for errors during linking
        const status = this.glContext.getProgramParameter(newProgram, this.glContext.LINK_STATUS);
        if (!status) {
            const infoLog = this.glContext.getProgramInfoLog(newProgram);
            this.glContext.deleteProgram(newProgram);
            throw `Unable to link WebGL program. Error:${infoLog}`;
        }

        return newProgram;
    }

    getBuffer() {
        return this.buf32;
    }

    render() {

        this.glContext.bindTexture(this.glContext.TEXTURE_2D, this.texture);
        this.glContext.texImage2D(this.glContext.TEXTURE_2D, 0, this.glContext.RGBA,
            this.width, this.height, 0,
            this.glContext.RGBA, this.glContext.UNSIGNED_BYTE,
            this.buf8);

        this.glContext.drawArrays(this.glContext.TRIANGLES, 0, WebGlDriver.NUM_VIEWPORT_VERTICES);
        this.glContext.bindTexture(this.glContext.TEXTURE_2D, null);
    }

    tsto() {
       return "WebGL driver";
    }
}