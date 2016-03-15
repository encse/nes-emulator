interface IRenderer {

    render();
    getBuffer(): Uint8Array
}

class CanvasRenderer implements IRenderer {

    ctx: CanvasRenderingContext2D;
    imageData: ImageData;
    buf8: Uint8Array;
    data: Uint32Array;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext("2d");
        this.imageData = this.ctx.getImageData(0, 0, 256, 240);
        const buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(buf);
        this.data = new Uint32Array(buf);
    }
    getBuffer(): Uint32Array {
        return this.data;
    }

    render(): void {
        (<any>this.imageData.data).set(this.buf8);
        this.ctx.putImageData(this.imageData, 0, 0);
    }
}


class WebGlRenderer implements IRenderer {
    buf8: Uint8ClampedArray;
    buf32: Uint32Array;

    // vertices representing entire viewport as two triangles which make up the whole
    // rectangle, in post-projection/clipspace coordinates
    static VIEWPORT_VERTICES = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        1.0, 1.0]);
    static NUM_VIEWPORT_VERTICES = WebGlRenderer.VIEWPORT_VERTICES.length / 2;

    // Texture coordinates corresponding to each viewport vertex
    static VERTEX_TEXTURE_COORDS = new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0]);

    // Convolution kernel weights (blurring effect by default)
    static CONVOLUTION_KERNEL_WEIGHTS = new Float32Array([
        1, 1, 1,
        1, 1, 1,
        1, 1, 1]);

    static TOTAL_WEIGHT = 0;

    glContext: WebGLRenderingContext;
    texture: WebGLTexture;
    width: number;
    height: number;

    constructor(canvas: HTMLCanvasElement) {
        [this.width, this.height] = [canvas.width, canvas.height];
        const buf = new ArrayBuffer(this.width * this.height * 4);
        this.buf8 = new Uint8Array(buf);
        this.buf32 = new Uint32Array(buf);

        for (var i = 0; i < WebGlRenderer.CONVOLUTION_KERNEL_WEIGHTS.length; ++i) {
            WebGlRenderer.TOTAL_WEIGHT += WebGlRenderer.CONVOLUTION_KERNEL_WEIGHTS[i];
        }

        //////////////////////////////////////////////////////////////
        // ImageMetadata private properties
        var metadata = this;
        var contextAttributes = { premultipliedAlpha: true };
        this.glContext = <WebGLRenderingContext>(canvas.getContext('webgl', contextAttributes) || canvas.getContext('experimental-webgl', contextAttributes));
        this.glContext.clearColor(0.0, 0.0, 0.0, 0.0);      // Set clear color to black, fully transparent

        var vertexShader = this.createShaderFromSource(this.glContext.VERTEX_SHADER,
            "\
            attribute vec2 aPosition;\
            attribute vec2 aTextureCoord;\
            \
            varying highp vec2 vTextureCoord;\
            \
            void main() {\
                gl_Position = vec4(aPosition, 0, 1);\
                vTextureCoord = aTextureCoord;\
            }");
        var fragmentShader = this.createShaderFromSource(this.glContext.FRAGMENT_SHADER,
            "\
            precision mediump float;\
            \
            varying highp vec2 vTextureCoord;\
            \
            uniform sampler2D uSampler;\
            uniform float uWeights[9];\
            uniform float uTotalWeight;\
            \
            /* Each sampled texture coordinate is 2 pixels appart rather than 1, to make filter effects more noticeable. */ \
            const float xInc = 2.0/640.0;\
            const float yInc = 2.0/480.0;\
            const int numElements = 9;\
            const int numCols = 3;\
            \
            void main() {\
                vec4 centerColor = texture2D(uSampler, vTextureCoord);\
                vec4 totalColor = vec4(0,0,0,0);\
                \
                for (int i = 0; i < numElements; i++) {\
                    int iRow = i / numCols;\
                    int iCol = i - (numCols * iRow);\
                    float xOff = float(iCol - 1) * xInc;\
                    float yOff = float(iRow - 1) * yInc;\
                    vec4 colorComponent = texture2D(uSampler, vec2(vTextureCoord.x+xOff, vTextureCoord.y+yOff));\
                    totalColor += (uWeights[i] * colorComponent);\
                }\
                \
                float effectiveWeight = uTotalWeight;\
                if (uTotalWeight <= 0.0) {\
                    effectiveWeight = 1.0;\
                }\
                /* Premultiply colors with alpha component for center pixel. */\
                gl_FragColor = vec4(totalColor.rgb * centerColor.a / effectiveWeight, centerColor.a);\
            }");
        var program = this.createProgram([vertexShader, fragmentShader]);
        this.glContext.useProgram(program);

        var positionAttribute = this.glContext.getAttribLocation(program, "aPosition");
        this.glContext.enableVertexAttribArray(positionAttribute);

        var textureCoordAttribute = this.glContext.getAttribLocation(program, "aTextureCoord");
        this.glContext.enableVertexAttribArray(textureCoordAttribute);

        // Associate the uniform texture sampler with TEXTURE0 slot
        var textureSamplerUniform = this.glContext.getUniformLocation(program, "uSampler");
        this.glContext.uniform1i(textureSamplerUniform, 0);

        // Associate the uniform convolution kernel weights with
        var convolutionKernelWeightsUniform = this.glContext.getUniformLocation(program, "uWeights[0]");
        this.glContext.uniform1fv(convolutionKernelWeightsUniform, WebGlRenderer.CONVOLUTION_KERNEL_WEIGHTS);

        var convolutionKernelTotalWeightUniform = this.glContext.getUniformLocation(program, "uTotalWeight");
        this.glContext.uniform1f(convolutionKernelTotalWeightUniform, WebGlRenderer.TOTAL_WEIGHT);

        // Create a buffer used to represent whole set of viewport vertices
        var vertexBuffer = this.glContext.createBuffer();
        this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, vertexBuffer);
        this.glContext.bufferData(this.glContext.ARRAY_BUFFER, WebGlRenderer.VIEWPORT_VERTICES, this.glContext.STATIC_DRAW);
        this.glContext.vertexAttribPointer(positionAttribute, 2, this.glContext.FLOAT, false, 0, 0);

        // Create a buffer used to represent whole set of vertex texture coordinates
        var textureCoordinateBuffer = this.glContext.createBuffer();
        this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, textureCoordinateBuffer);
        this.glContext.bufferData(this.glContext.ARRAY_BUFFER, WebGlRenderer.VERTEX_TEXTURE_COORDS, this.glContext.STATIC_DRAW);
        this.glContext.vertexAttribPointer(textureCoordAttribute, 2, this.glContext.FLOAT, false, 0, 0);

        // Create a texture to contain images from Kinect server
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
        var shader = this.glContext.createShader(shaderType);
        this.glContext.shaderSource(shader, shaderSource);
        this.glContext.compileShader(shader);

        // Check for errors during compilation
        const status = this.glContext.getShaderParameter(shader, this.glContext.COMPILE_STATUS);
        if (!status) {
            const infoLog = this.glContext.getShaderInfoLog(shader);
            console.log("Unable to compile '" + shaderType + "' shader. Error:" + infoLog);
            this.glContext.deleteShader(shader);
            return null;
        }

        return shader;
    }

    // Create a WebGL program attached to the specified shaders.
    //     .createProgram(shaderArray)
    //
    // shaderArray: Array of shaders to attach to program
    createProgram(shaderArray) {
        var newProgram = this.glContext.createProgram();

        for (var shaderIndex = 0; shaderIndex < shaderArray.length; ++shaderIndex) {
            this.glContext.attachShader(newProgram, shaderArray[shaderIndex]);
        }
        this.glContext.linkProgram(newProgram);

        // Check for errors during linking
        var status = this.glContext.getProgramParameter(newProgram, this.glContext.LINK_STATUS);
        if (!status) {
            var infoLog = this.glContext.getProgramInfoLog(newProgram);
            console.log("Unable to link Kinect WebGL program. Error:" + infoLog);
            this.glContext.deleteProgram(newProgram);
            return null;
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

        this.glContext.drawArrays(this.glContext.TRIANGLES, 0, WebGlRenderer.NUM_VIEWPORT_VERTICES);
        this.glContext.bindTexture(this.glContext.TEXTURE_2D, null);
    }

}
