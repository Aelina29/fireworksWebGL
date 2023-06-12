function Spark() {
    this.init();
}

// количество искр
Spark.sparksCount = 350;

Spark.prototype.init = function() {
    // время создания искры
    this.timeFromCreation = performance.now();

    // задаём направление полёта искры в градусах, от 0 до 360
    const angle = Math.random() * 360;
    //const angle = 0.1*360;
    // радиус - это расстояние, которое пролетит искра
    //const radius = Math.random();
    const maxrad = 3;
    const minrad = 0.1;
    const radius = Math.random() * (maxrad - minrad) + minrad;
    // отмеряем точки на окружности - максимальные координаты искры
    this.xMax = Math.cos(angle) * radius;
    this.yMax = Math.sin(angle) * radius;

    // dx и dy - приращение искры за вызов отрисовки, то есть её скорость,
    // у каждой искры своя скорость. multiplier подобран экспериментально
    const multiplier = 4000 + Math.random() * 2000;
    //const multiplier = 6000;
    this.dx = -this.xMax / multiplier;
    this.dy = -this.yMax / multiplier;

    //+смещаем финальную точку
    this.xMax += kx;
    this.yMax += ky;

    // Для того, чтобы не все искры начинали движение из начала координат,
    // делаем каждой искре свой отступ, но не более максимальных значений.
    //+смещаем начальную точку
    this.x = kx + (this.dx * 1000) % this.xMax;
    this.y = ky + (this.dy * 1000) % this.yMax;

    const maxsize = 20.0;
    const minsize = 70.0;
    this.size_of_point = Math.random() * (maxsize - minsize) + minsize;
};

Spark.prototype.move = function(time) {
    // находим разницу между вызовами отрисовки, чтобы анимация работала
    // одинаково на компьютерах разной мощности
    const timeShift = time - this.timeFromCreation;
    this.timeFromCreation = time;

    // приращение зависит от времени между отрисовками
    const speed = timeShift;
    this.x += this.dx * speed;
    this.y += this.dy * speed;

    // если искра достигла конечной точки, запускаем её заново из начала координат
    if (Math.abs(this.x) > Math.abs(this.xMax) || Math.abs(this.y) > Math.abs(this.yMax)) {
        this.init();
    }
    //
    // if (Math.abs(this.x) > Math.abs(this.xMax/2) || Math.abs(this.y) > Math.abs(this.yMax/2)) {
    //     this.init();
    // }
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
    for (let i = 0; i < Spark.sparksCount; i++) {
        sparks.push(new Spark());
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
    let textureLocationSpark = gl.getUniformLocation(programSpark, "u_texture");
    let pMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_pMatrix");
    let mvMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_mvMatrix");

    let texture = gl.createTexture();
    let image = new Image();
    image.src = "../textures/fog1.png";
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

    // function drawTracks(positions) {
    //     let colors = [];
    //     let positionsFromCenter = [];
    //     for (let i = 0; i < positions.length; i += 3) {
    //         // для каждой координаты добавляем точку начала координат, чтобы получить след искры
    //         positionsFromCenter.push(0, 0, 0);
    //         positionsFromCenter.push(positions[i], positions[i + 1], positions[i + 2]);

    //         // цвет в начале координат будет белый (горячий), а дальше будет приближаться к оранжевому
    //         colors.push(1, 1, 1, 0.47, 0.31, 0.24);
    //     }

    //     gl.useProgram(programTrack);

    //     gl.uniformMatrix4fv(pMatrixUniformLocationTrack, false, pMatrix);
    //     gl.uniformMatrix4fv(mvMatrixUniformLocationTrack, false, mvMatrix);

    //     let positionBuffer = gl.createBuffer();
    //     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    //     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsFromCenter), gl.STATIC_DRAW);
    //     gl.vertexAttribPointer(positionAttributeLocationTrack, 3, gl.FLOAT, false, 0, 0);
    //     gl.enableVertexAttribArray(positionAttributeLocationTrack);

    //     let colorBuffer = gl.createBuffer();
    //     gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    //     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    //     gl.vertexAttribPointer(colorAttributeLocationTrack, 3, gl.FLOAT, false, 0, 0);
    //     gl.enableVertexAttribArray(colorAttributeLocationTrack);

    //     gl.drawArrays(gl.LINES, 0, positionsFromCenter.length / 3);
    // }

    function drawSparks(positions, sizes_of_points) {
        gl.useProgram(programSpark);

        gl.uniformMatrix4fv(pMatrixUniformLocationSpark, false, pMatrix);
        gl.uniformMatrix4fv(mvMatrixUniformLocationSpark, false, mvMatrix);

        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        let sizesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sizesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes_of_points), gl.STATIC_DRAW);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureLocationSpark, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);  
        gl.vertexAttribPointer(positionAttributeLocationSpark, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocationSpark);
              
        gl.bindBuffer(gl.ARRAY_BUFFER, sizesBuffer);
        gl.vertexAttribPointer(positionAttributeLocationSparkSize, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocationSparkSize);

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
        sparks.forEach(function(item) {                             //sparks.forEach(function(item, i, arr) {
            positions.push(item.x);
            positions.push(item.y);
            // искры двигаются только в одной плоскости xy
            positions.push(0);
        });

        let sizes_of_points = [];
        //получаем размеры искр для передачи в функции
        sparks.forEach(function(item) {                             //sparks.forEach(function(item, i, arr) {
            sizes_of_points.push(item.size_of_point);
        });

        //drawTracks(positions);
        drawSparks(positions, sizes_of_points);

        requestAnimationFrame(drawScene);
    }
}

var kx = 0;
var ky = -2;
var hei;
var wid;
main();