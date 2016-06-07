var canvasTarget = $('#target');

var container;
var mesh_cube_env;

var camera, scene, renderer,
    materials = [], objects = [],
    singleMaterial,
    parameters, i, j, k, h, color, x, y, z, s, n, nobjects,
    cubeMaterial;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var width = canvasTarget.width();
var height = canvasTarget.height();

var postprocessing = {};

var material = new THREE.MeshBasicMaterial({color: '#DDD', wireframe: true});

var cli_group;
var cli_group_cmd;
var cli_group_output;

var cli_char_offsetX = 260;
var cli_meshes = [];
var cli_meshes_count = 0;
var cli_carret;
var cli_carret_enabled = false;
var cli_carret_offsetX = 294;
var cli_outputchar_offsetX = 460;
var cli_data = {
    'id': 'uid=1000(ced) gid=1000(ced) groups=1000(ced)',
    'uname -a': 'Linux dev2 3.2.0-4-amd64 #1 Debian 3.2.68-1+deb7u4 x86_64 GNU/Linux',
    'uname': 'Linux',
    'uname -m': 'x86_64',
    'ls': 'cedsys.txt Desktop Documents Downloads Pictures Projects',
    'ls -a': 'cedsys.txt Desktop Documents Downloads Pictures Projects',
    'ls -al': 'cedsys.txt Desktop Documents Downloads Pictures Projects',
    'ls desktop': 'wallpaper.png',
    'ls documents': 'products.xsl resume.pdf todo.xsl',
    'ls downloads': 'music.txt',
    'ls pictures': 'cedsys.png findex.png tux.png',
    'ls projects': 'Access Denied!',
    'df': '29657164    5068640  23082016  19% /',
    'df -h': '29657164    5068640  23082016  19% /',
    'cat /etc/passwd': 'Access Denied!',
    'cat cedsys.txt': 'Welcome :) Enjoy your stay.',
    'history': 'touch CedSys.txt',
    'pwd': '/home/ced/',
    'date': new Date().toJSON().slice(0,10),
    'help': 'commands: id, cat, uname, date, df, history, ls',
    'man': 'commands: id, cat, uname, date, df, history, ls',
    'whoami': 'ced',
    'who': 'ced  pts/0  2015-11-11 22:49 (:0)'
};

init();
animate();

$(document).keypress(function(e) {
    if(e.which == 8){
        e.preventDefault();
        return false;
    }

    var key = String.fromCharCode(e.which);
    if(e.which == 13) {
        return;
    }

    cli_addCmdChar(key);
});

$('html').on('keydown' , function(event) {
    if(! $(event.target).is('input')) {
        if(event.which == 8) {
            cli_delCmdChar();
            cli_cmdClean();
            cli_outputClean();
            event.preventDefault();
            return false;
        } else if (event.which == 13) {
            cli_execute();
        }
    }
});

function cli_cmdClean(){
    if(cli_group_output.getObjectByName("output")) {
        var l = cli_meshes.length;

        for (var i = 0; i != l; i += 1) {
            cli_delCmdChar();
        }
    }
}

function cli_outputClean(){
    cli_group_output.remove(cli_group_output.getObjectByName("output"));
}

function cli_execute(){
    var input = cli_getInput();

    if(input.length >= 1){
        if(cli_data.hasOwnProperty(input)){
            cli_addOutput(cli_data[input]);
            return;
        }
    }

    cli_cmdClean();
    cli_outputClean();

    cli_addOutput("Command not found");
}

function cli_getInput(){
    var str = '';
    cli_meshes.forEach(function(object){
       if (typeof object === 'string' || object instanceof String){
           str += object;
       } else {
           str += object.userData['text'];
       }
    });

    return str.toLowerCase();
}

function cli_addOutput(text){
    cli_outputClean();

    text = createText(text, 70);
    var boundingBox = text[2].boundingBox;
    var obj = text[0];

    obj.position.x = cli_outputchar_offsetX;
    obj.position.y = 0;
    obj.position.z = 200;
    obj.rotation.y = 0;
    obj.name = "output";

    cli_group_output.add(obj);
}

function cli_addCmdChar(char){
    if(char != " ") {
        text = createText(char, 70);
        var boundingBox = text[2].boundingBox;
        var obj = text[0];
        obj.name = 'cli_' + cli_meshes_count;

        obj.userData['text'] = char;

        obj.position.x = cli_char_offsetX;
        obj.position.y = -60;
        obj.position.z = 200;
        obj.rotation.x = 0;
        obj.rotation.y = Math.PI * 2;

        cli_meshes.push(obj);
        cli_group_cmd.add(cli_meshes[cli_meshes_count]);
        cli_meshes_count += 1;

        cli_setCharForwardPos(20, boundingBox.max.x);
    } else {
        cli_setCharForwardPos(50, 0);

        cli_meshes.push(" ");
        cli_meshes_count += 1;
    }
}

function cli_delCmdChar(){
    var object = cli_meshes[cli_meshes_count-1];
    if(object != " ") {
        var boundingBox = object.geometry.boundingBox;

        cli_group_cmd.remove(object);

        cli_setCharBackwardPos(20, boundingBox.max.x);

        cli_meshes_count -= 1;
        cli_meshes.pop();
    } else {
        cli_setCharBackwardPos(50, 0);

        cli_meshes_count -= 1;
        cli_meshes.pop();
    }
}

function cli_setCharForwardPos(x, boundingX){
    cli_char_offsetX += (boundingX + x);
    cli_carret_offsetX += (boundingX + x);
    cli_carret.position.x = cli_carret_offsetX;
}

function cli_setCharBackwardPos(x, boundingX){
    cli_char_offsetX -= (boundingX + x);
    cli_carret_offsetX -= (boundingX + x);
    cli_carret.position.x = cli_carret_offsetX;
}


function init() {
    camera = new THREE.PerspectiveCamera( 40, width / height, 1, 5000 );
    camera.position.z = 460;

    scene = new THREE.Scene();
    scene.matrixAutoUpdate = false;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize( width, height );
    renderer.sortObjects = false;
    renderer.autoClear = false;

    canvasTarget.html(renderer.domElement);

    // Create a cube
    var geometry = new THREE.BoxGeometry(1700, 1700, 1700, 6, 6, 6);

    mesh_cube_env = new THREE.Mesh( geometry, material );
    mesh_cube_env.position.set(0, 0, 0);
    mesh_cube_env.rotation.y += 30;

    scene.add(mesh_cube_env);

    // Create some text
    cli_group_cmd = new THREE.Group();
    cli_group_cmd.position.x = -1050;
    cli_group_cmd.position.y = 150;
    cli_group_cmd.rotation.y = 0.14;
    cli_group_cmd.position.z = -400;

    var letters = ['CED:', '~', '#'];
    for(var i = 0; i != letters.length; i += 1) {
        var text = createText(letters[i], 70);

        posY = -60;
        posX = text[1];
        if(i == 1) posY = -90;
        if(i == 1) posX = text[1] + 130;
        else if(i == 2) posX = text[1] + 200;
        text[0].position.set(posX, posY, 200);
        text[0].rotation.y = Math.PI * 2;
        cli_group_cmd.add(text[0]);
    }

    // Create the carret
    var geometry2 = new THREE.BoxGeometry(40, 72, 20, 2, 2, 2);

    cli_carret = new THREE.Mesh( geometry2, material );
    cli_carret.position.set(cli_carret_offsetX ,-26, 200);
    cli_carret.rotation.x = 0;
    cli_carret.visible = false;
    cli_group_cmd.add(cli_carret);

    //scene.add(cli_group_cmd);

    // Create the output group
    cli_group_output = new THREE.Group();
    cli_group_output.position.x = -2168
    cli_group_output.position.y = 22;
    cli_group_output.position.z = -600;
    cli_group_output.rotation.y = 0.14;

    //scene.add(cli_group_output);

    cli_group = new THREE.Group();
    cli_group.add(cli_group_cmd);
    cli_group.add(cli_group_output);
    cli_group.position.x = -200;

    scene.add(cli_group);

    // bokeh, if needed
    initPostprocessing();

    // hook events, for camera stuff
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    document.addEventListener( 'touchmove', onDocumentTouchMove, false );

    window.addEventListener( 'resize', onWindowResize, false );
}

function createText(text, size) {
    var options = {
        size: size,
        height: 20,
        curveSegments: 2,
        font: "helvetiker",
        bevelEnabled: false
    };

    var textMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ddd'),
        side: THREE.DoubleSide,
        wireframe: true
    });

    var textShapes = THREE.FontUtils.generateShapes(text, options);
    var text3d = new THREE.ShapeGeometry(textShapes);

    text3d.computeBoundingBox();

    var centerOffset = -0.5 * (text3d.boundingBox.max.x - text3d.boundingBox.min.x);
    text = new THREE.Mesh(text3d, textMaterial);

    return [text, centerOffset, text3d];
}

// Update mouse positions
function onDocumentMouseMove( event ) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

// Uhm...
function onDocumentTouchStart( event ) {
    if ( event.touches.length == 1 ) {
        event.preventDefault();

        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfY;
    }
}

// Yep
function onDocumentTouchMove( event ) {
    if ( event.touches.length == 1 ) {
        event.preventDefault();

        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfY;
    }
}

// redraw screen with different sizes
function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    width = $('#target').width();
    height = $('#target').height();

    camera.updateProjectionMatrix();

    renderer.setSize( width, height );
    postprocessing.composer.setSize( width, height );

}

// bokeh, if needed
function initPostprocessing() {
    var renderPass = new THREE.RenderPass( scene, camera );

    var bokehPass = new THREE.BokehPass( scene, camera, {
        focus: 		1.0,
        aperture:	0.02,
        maxblur:	0,

        width: width,
        height: height
    } );

    bokehPass.renderToScreen = true;

    var composer = new THREE.EffectComposer( renderer );

    composer.addPass( renderPass );
    composer.addPass( bokehPass );

    postprocessing.composer = composer;
    postprocessing.bokeh = bokehPass;
}

// frame entry function
function animate() {
    requestAnimationFrame(animate, renderer.domElement);
    render();
}

// the loop
function render() {
    var time = Date.now() * 0.00005;

    // rotate the background cube
    mesh_cube_env.rotation.y += 0.0015;

    cli_carret.rotation.x += 0.4;

    // update camera POS based on mouse POS
    //camera.position.x += ( (mouseX+40) - camera.position.x ) * 0.00005;
    //camera.position.y += ( - (mouseY) - camera.position.y ) * 0.00005;
    camera.lookAt( scene.position );

    // set HSL if needed
    if ( !singleMaterial ) {
        for( i = 0; i < nobjects; i ++ ) {
            h = ( 360 * ( i / nobjects + time ) % 360 ) / 360;
            materials[ i ].color.setHSL( h, 1, 0.5 );
        }
    }

    postprocessing.composer.render(0.1);
}

function blinkCarret(){
    setTimeout(function () {
        if(cli_carret_enabled){
            cli_carret.visible = false;
            cli_carret_enabled = false;
        } else {
            cli_carret.visible = true;
            cli_carret_enabled = true;
        }
        blinkCarret();
    }, 600);
}

var date_start = new Date();
blinkCarret();