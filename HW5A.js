/*
Nataly Tuong
Joshua Xotoy
William Lopez
10-20-2026

* Referenced the Week 9 Shaded Cube example! 
Mostly referenced buffer setup, quad pattern, and light/material
*/

"use strict";

var canvas, gl, program;
var positionsArray = [];
var normalsArray = [];

/*
II. Add a light, and use the modified Phong lighting model to color your object.
It’s your choice about whether to compute the lighting in the vertex shader 
or the fragment shader.
*/
// Light direction/eye coords
// w = 0 makes a directional light!
// (x,y,z) is the direction the light
// made it upper corner AKA what shader uses as L
var lightPosition = vec4(0.4, 0.8, 0.45, 0.0);

// Light colors
var lightAmbient = vec4(0.4, 0.4, 0.4, 1.0);
var lightDiffuse = vec4(1.1, 1.1, 1.1, 1.0);
var lightSpecular = vec4(0.8, 0.8, 0.8, 1.0);

// Material
var materialAmbient = vec4(0.05, 0.12, 0.35, 1.0);
var materialDiffuse = vec4(0.6, 1.0, 0.25, 1.0);
var materialSpecular = vec4(0.9, 1.0, 0.75, 1.0);
var materialShininess = 60.0;

// Camera/projection
var eye = vec3(0.0, 0.0, 34.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

// Rotation
var thetaX = 20,
  thetaY = 30;
var speed = 2.0;
var keysDown = {};
var modelViewLoc;

// Clover shape is made of 5 boxes
// the boxes are basically chunky hearts
// boxes are [centerX, centerY, width, height] in local coordinates
// (0,0) is the middle of the clover
var leaf = [
  [-1.5, 6, 2, 1],
  [1.5, 6, 2, 1],
  [0, 4.5, 7, 2],
  [0, 3, 5, 1],
  [0, 2, 3, 1],
];

// Midddle part of the clover that connects the leaves together
var center = [0, 0, 3, 3];
var stem = [
  [0, -7, 1, 3],
  [-1.5, -8, 2, 1],
];
var thickness = 4.0;

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

// The class example code for cube had 8 fixed vertices
// box() builds its 8 corners from the center and size as clover components
function box(cx, cy, w, h) {
  var hx = w / 2,
    hy = h / 2,
    z = thickness / 2;
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

// each leaf is the top one rotated 90 degrees counterclockwise
function buildClover() {
  for (var k = 0; k < 4; k++) {
    for (var i = 0; i < leaf.length; i++) {
      var x = leaf[i][0],
        y = leaf[i][1],
        w = leaf[i][2],
        h = leaf[i][3];
      for (var turn = 0; turn < k; turn++) {
        // Rotate 90 degrees
        var oldX = x;
        x = -y;
        y = oldX;
        var oldW = w;
        w = h;
        h = oldW;
      }
      box(x, y, w, h);
    }
  }
  box(center[0], center[1], center[2], center[3]);
  for (var s = 0; s < stem.length; s++) {
    box(stem[s][0], stem[s][1], stem[s][2], stem[s][3]);
  }
}

function buildObject() {
  buildClover();
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

  // The class cube example used buttons, but these handlers check for when arrow keys are held down
  // render() does the turning
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

  /*
  I. Vertex coordinates are not in the default range - a (non-identity) 
  Model-View matrix appropriate for viewing is required.
  */
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
