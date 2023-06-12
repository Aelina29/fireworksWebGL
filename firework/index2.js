function Tail() {
    this.init();
}

// количество искр
Tail.sparksCount = 25;

Tail.prototype.init = function() {
    
    this.yMax = Math.random() * (-1 - 1.3) + 1.3;
    this.dy = (this.yMax+2)  / 40;
    this.y = -2;

    //прозрачность
    this.trasparence = 1.1;
    this.delta_trasparence = (this.yMax+2) / 250;
};

Tail.prototype.move = function(time) {
    // находим разницу между вызовами отрисовки, чтобы анимация работала
    // одинаково на компьютерах разной мощности
    const timeShift = time - this.timeFromCreation;
    this.timeFromCreation = time;

    // приращение зависит от времени между отрисовками
    const speed = timeShift;
    this.y += this.dy * speed;
    //this.trasparence -=  this.delta_trasparence;

    // если искра достигла конечной точки, запускаем её заново из начала координат
    if (Math.abs(this.y) > Math.abs(this.yMax)) {
        this.init();
    }
};


function main() {
    const canvas = document.getElementById("my_canvas");
    gl = canvas.getContext("webgl");    
    if (!gl) {
        exit;
    }
    hei = gl.canvas.height;
    wid = gl.canvas.width;
    let sparks = [];
    for (let i = 0; i < Tail.sparksCount; i++) {
        sparks.push(new Tail());
        console.log(sparks[sparks.length-1].y);
    }
    // gl.SRC_ALPHA - рисуемая искра умножается на прозрачный канал, чтобы убрать фон
    // изображения. gl.ONE - уже нарисованные искры остаются без изменений
    gl.enable(gl.BLEND);//Смешивание искр
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    let programTrack = webglUtils.createProgramFromScripts(gl, ["vertex-shader-track", "fragment-shader-track"]);

    let positionAttributeLocationTrack = gl.getAttribLocation(programTrack, "a_position");
    let colorAttributeLocationTrack = gl.getAttribLocation(programTrack, "a_color");
    let pMatrixUniformLocationTrack = gl.getUniformLocation(programTrack, "u_pMatrix");
    let mvMatrixUniformLocationTrack = gl.getUniformLocation(programTrack, "u_mvMatrix");

    let programSpark = webglUtils.createProgramFromScripts(gl, ["vertex-shader-spark", "fragment-shader-spark"]);

    let positionAttributeLocationSpark = gl.getAttribLocation(programSpark, "a_position");
    let positionAttributeLocationSparkSize = gl.getAttribLocation(programSpark, "a_size");
    let positionAttributeLocationSparkTranspar = gl.getAttribLocation(programSpark, "a_trasparence");
    let textureLocationSpark = gl.getUniformLocation(programSpark, "u_texture");
    let pMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_pMatrix");
    let mvMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_mvMatrix");

    let texture = gl.createTexture();
    let image = new Image();
    image.src = "fireworks/pngwing.com(1).png";
    image.addEventListener('load', function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        // Не допускаем повторения по s-координате.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);

        requestAnimationFrame(drawScene);//чтоб рисовал только после полной загрузки картинки
    });

    let mvMatrix = mat4.create();
    let pMatrix = mat4.create();

    function drawTracks(positions) {
        let colors = [];
        let positionsFromCenter = [];
        for (let i = 0; i < positions.length; i += 3) {
            // для каждой координаты добавляем точку начала координат, чтобы получить след искры
            positionsFromCenter.push(0, 0, 0);
            positionsFromCenter.push(positions[i], positions[i + 1], positions[i + 2]);

            // цвет в начале координат будет белый (горячий), а дальше будет приближаться к оранжевому
            //colors.push(1, 1, 1, 0.47, 0.31, 0.24);
            colors.push(0,0,0,1,1,1);
        }

        gl.useProgram(programTrack);

        gl.uniformMatrix4fv(pMatrixUniformLocationTrack, false, pMatrix);
        gl.uniformMatrix4fv(mvMatrixUniformLocationTrack, false, mvMatrix);

        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsFromCenter), gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionAttributeLocationTrack, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocationTrack);

        let colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        gl.vertexAttribPointer(colorAttributeLocationTrack, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorAttributeLocationTrack);

        gl.drawArrays(gl.LINES, 0, positionsFromCenter.length / 3);
    }

    function drawTracksUp(positions,track_trasparence) {
        let colors = [];
        let positionsFromCenter = [];
        for (let i = 0; i < positions.length; i++) {
            // для каждой координаты добавляем точку начала координат, чтобы получить след искры
            const x = Math.random() * (-4 - 4) + 4;         
            positionsFromCenter.push(x, -2, 0);         
            positionsFromCenter.push(x, positions[i], 0);
            //console.log(positions[i]);

            // цвет в начале координат будет белый (горячий), а дальше будет приближаться к оранжевому
            colors.push(1,1,1,0,0,0);
        }

        gl.useProgram(programTrack);

        gl.uniformMatrix4fv(pMatrixUniformLocationTrack, false, pMatrix);
        gl.uniformMatrix4fv(mvMatrixUniformLocationTrack, false, mvMatrix);

        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsFromCenter), gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionAttributeLocationTrack, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocationTrack);

        let colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        gl.vertexAttribPointer(colorAttributeLocationTrack, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorAttributeLocationTrack);

        let transpBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, transpBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(track_trasparence), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, transpBuffer);
        gl.vertexAttribPointer(positionAttributeLocationSparkTranspar, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocationSparkTranspar);

        gl.drawArrays(gl.LINES, 0, positionsFromCenter.length / 3);
    }

    function drawSparks(positions, sizes_of_points,trasparence) {
        gl.useProgram(programSpark);

        gl.uniformMatrix4fv(pMatrixUniformLocationSpark, false, pMatrix);
        gl.uniformMatrix4fv(mvMatrixUniformLocationSpark, false, mvMatrix);

        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        let sizesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sizesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes_of_points), gl.STATIC_DRAW);

        
        let transpBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, transpBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(trasparence), gl.STATIC_DRAW);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureLocationSpark, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);  
        gl.vertexAttribPointer(positionAttributeLocationSpark, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocationSpark);
              
        gl.bindBuffer(gl.ARRAY_BUFFER, sizesBuffer);
        gl.vertexAttribPointer(positionAttributeLocationSparkSize, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocationSparkSize);

        gl.bindBuffer(gl.ARRAY_BUFFER, transpBuffer);
        gl.vertexAttribPointer(positionAttributeLocationSparkTranspar, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocationSparkTranspar);

        gl.drawArrays(gl.POINTS, 0, positions.length / 3);
    }

    function drawScene(now) {
        // обновляем размер canvas на случай, если он растянулся или сжался вслед за страницей
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        //console.log(gl.canvas.height)

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(pMatrix, 45, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, mvMatrix, [0, 0, -3.5]);

        for (let i = 0; i < sparks.length; i++) {
            sparks[i].move(now);
        }

        let positions = [];
        //получаем координаты искр для передачи в функции
        sparks.forEach(function(item) {
            positions.push(item.y);
            //console.log(item.y);
        });
        

        let sizes_of_points = [];
        //получаем размеры искр для передачи в функции
        sparks.forEach(function(item) {                             //sparks.forEach(function(item, i, arr) {
            sizes_of_points.push(item.size_of_point);
        });

        let trasparence = [];
        sparks.forEach(function(item) {                             //sparks.forEach(function(item, i, arr) {
            trasparence.push(item.trasparence);
            trasparence.push(item.trasparence);
        });
        //console.log(trasparence);

        let track_trasparence = [];
        sparks.forEach(function(item) {                             //sparks.forEach(function(item, i, arr) {
            track_trasparence.push(item.trasparence);
            track_trasparence.push(item.trasparence);
        });
        //console.log(track_trasparence);

        //drawTracks(positions,track_trasparence);
        //drawSparks(positions, sizes_of_points, trasparence);
        drawTracksUp(positions,track_trasparence);

        requestAnimationFrame(drawScene);
    }
}

var kx = 0;
var ky = 0;
var hei;
var wid;
main();