"use strict";

var canvas, gl, program;
var positionsArray = [];
var normalsArray = [];

/*
II. Add a light, and use the modified Phong lighting model to color your object.
It’s your choice about whether to compute the lighting in the vertex shader 
or the fragment shader.
*/
// Light directon/eye coords
// Material
var lightPosition = vec4(0.4, 0.8, 0.45, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.1, 0.4, 0.2, 1.0);
var materialDiffuse = vec4(0.3, 0.9, 0.3, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 40.0;

// Camera/projection
var eye = vec3(0.0, 0.0, 20.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

// Rotation
var thetaX = 20,
  thetaY = 30;
var speed = 2.0;
var keysDown = {};
var modelViewLoc;

function quad(v, a, b, c, d) {
  var normal = normalize(
    vec3(cross(subtract(v[b], v[a]), subtract(v[c], v[b]))),
  );
  var order = [a, b, c, a, c, d];
  for (var i = 0; i < order.length; i++) {
    positionsArray.push(v[order[i]]);
    normalsArray.push(normal);
  }
}

function box(cx, cy, w, h, depth) {
  var hx = w / 2,
    hy = h / 2,
    z = depth / 2;
  var v = [
    vec4(cx - hx, cy - hy, z, 1.0),
    vec4(cx - hx, cy + hy, z, 1.0),
    vec4(cx + hx, cy + hy, z, 1.0),
    vec4(cx + hx, cy - hy, z, 1.0),
    vec4(cx - hx, cy - hy, -z, 1.0),
    vec4(cx - hx, cy + hy, -z, 1.0),
    vec4(cx + hx, cy + hy, -z, 1.0),
    vec4(cx + hx, cy - hy, -z, 1.0),
  ];
  quad(v, 1, 0, 3, 2);
  quad(v, 2, 3, 7, 6);
  quad(v, 3, 0, 4, 7);
  quad(v, 6, 5, 1, 2);
  quad(v, 4, 5, 6, 7);
  quad(v, 5, 4, 0, 1);
}

/*
I. Vertex coordinates are not in the default range - a (non-identity) 
Model-View matrix appropriate for viewing is required.
*/
function buildObject() {
  box(0, 0, 6, 4, 3);
}

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext("webgl2");
  if (!gl) alert("WebGL 2.0 isn't available");

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  buildObject();

  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
  var normalLoc = gl.getAttribLocation(program, "aNormal");
  gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normalLoc);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);
  var positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  gl.uniform4fv(
    gl.getUniformLocation(program, "uAmbientProduct"),
    mult(lightAmbient, materialAmbient),
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "uDiffuseProduct"),
    mult(lightDiffuse, materialDiffuse),
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "uSpecularProduct"),
    mult(lightSpecular, materialSpecular),
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "uLightPosition"),
    lightPosition,
  );
  gl.uniform1f(gl.getUniformLocation(program, "uShininess"), materialShininess);

  /*
  III. Please use a perspective projection matrix for viewing. 
  Feel free to determine the properties of the projection they way you want. 
  */
  var projectionMatrix = perspective(
    45.0,
    canvas.width / canvas.height,
    0.1,
    100.0,
  );
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "uProjectionMatrix"),
    false,
    flatten(projectionMatrix),
  );
  modelViewLoc = gl.getUniformLocation(program, "uModelViewMatrix");

  window.addEventListener("keydown", function (e) {
    if (e.key.indexOf("Arrow") !== 0) return;
    keysDown[e.key] = true;
    e.preventDefault();
  });
  window.addEventListener("keyup", function (e) {
    keysDown[e.key] = false;
  });

  render();
};

var render = function () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  /*
  IV. Interact with your object with the arrow keys; 
  the arrow keys will rotate the object as follows:
  */

  // Left arrow: rotate counterclockwise about the Y axis
  if (keysDown["ArrowLeft"]) thetaY += speed;

  // Right arrow: rotate clockwise about the Y axis
  if (keysDown["ArrowRight"]) thetaY -= speed;

  // Up arrow: rotate counterclockwise about the X axis
  if (keysDown["ArrowUp"]) thetaX += speed;

  // Down arrow: rotate clockwise about the X axis.
  if (keysDown["ArrowDown"]) thetaX -= speed;

  var viewMatrix = lookAt(eye, at, up);
  var modelMatrix = mult(
    rotate(thetaX, vec3(1, 0, 0)),
    rotate(thetaY, vec3(0, 1, 0)),
  );
  gl.uniformMatrix4fv(
    modelViewLoc,
    false,
    flatten(mult(viewMatrix, modelMatrix)),
  );

  gl.drawArrays(gl.TRIANGLES, 0, positionsArray.length);
  requestAnimationFrame(render);
};
