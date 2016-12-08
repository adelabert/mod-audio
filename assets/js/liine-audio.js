
var camera, scene, renderer, stars = [], controls;

var object, light;

var context;
var source, sourceJs;
var analyser;
var buffer;
var url = 'assets/misc/Stay.mp3';
var array = new Array();
var particles, particle, count = 0;
var SEPARATION = 50, AMOUNTX = 50, AMOUNTY = 50;

var song, analyzer;

function app(){
	if ( ! Detector.webgl ) {
		Detector.addGetWebGLMessage();
	}
	try {
	    if(typeof webkitAudioContext === 'function') { 
	    	// webkit-based
	    	context = new webkitAudioContext();
	    }else { 
	    	// other browsers that support AudioContext
	    	context = new AudioContext();
	    }
	}catch(e) {
    	// Web Audio API is not supported in this browser
    	alert("Web Audio API is not supported in this browser");
	}
	// sound();
	// preload();
	init();
	animate();

}

function init(){
	// CAMERA
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
	
	camera.position.y = 180;
	camera.position.x = 360;
	camera.position.z = 1200;
	

	camera.rotation.y = 45;  // Y first
	camera.rotation.x = 45;  // X second
	camera.rotation.z = 0;

    // SCENE
    scene = new THREE.Scene();

	// RENDERER
	// renderer = new THREE.WebGLRenderer();
	renderer = new THREE.CanvasRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setClearColor( 0xffffff, 1 );

	// CONTROLLER MOUSE
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.dampingFactor = 0.03;
	controls.enableZoom = false;
	controls.minDistance = 0.0;
	controls.maxDistance = 2000.0;
	controls.maxPolarAngle = 90;
	controls.enabled = false;

    //set the size of the renderer
    renderer.setSize( window.innerWidth, window.innerHeight );

	//add the renderer to the html document body
	document.body.appendChild( renderer.domElement );

	// EVENT HANDLE
	window.addEventListener( 'resize', onWindowResize, false );
	renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
	renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );

	// ACTUALLY ADD
	createScene();
}
/* ======================[ LOAD ]========================== */
function preload() {
  	song = loadSound('assets/misc/Qasus-Sheis.mp3'); 
}

function setup() {
	createCanvas(0,0);
  	song.play();

  	// create a new Amplitude analyzer
  	analyzer = new p5.Amplitude();

  	// Patch the input to an volume analyzer
  	analyzer.setInput(song);
}
function sound(){
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = "arraybuffer";

	request.onload = function(){
		context.decodeAudioData(
			request.response,
			function(buffer){
				if(!buffer){
                // Error decoding file data

                return;
            }

            sourceJs = context.createScriptProcessor(4096, 1, 1);
            sourceJs.buffer = buffer;
            sourceJs.connect(context.destination);
            analyser = context.createAnalyser();
            analyser.smoothingTimeConstant = 0.5;
            // analyser.fftSize = 512;
            analyser.fftSize = 512 * 2;


            source = context.createBufferSource();
            source.buffer = buffer;

            source.connect(analyser);
            analyser.connect(sourceJs);
            source.connect(context.destination);

            sourceJs.onaudioprocess = function(e){
            	array = new Uint8Array(analyser.frequencyBinCount);
            	analyser.getByteFrequencyData(array);
            };

            source.start(0);
            
        },function(error) {
            // Decoding error
            
        });
	};
	request.send();
}
/* ======================[ ON EVENT ]========================== */
function onWindowResize(){
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
	
	
}
function onDocumentMouseDown( event ) {
	event.preventDefault();
	
}

function onDocumentMouseUp( event ) {
	event.preventDefault();
	
}
/* =======================[ ON ANIM ]========================= */
function animate( time ){
	// camera.position.x += 0.5;
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	controls.update();
	animateLines();

	if(analyzer.getLevel() >= 0.3 && analyzer.getLevel() < 0.6){
		renderer.setClearColor( 0xffffff, 1 );
	}else if(analyzer.getLevel() >= 0.5){
		renderer.setClearColor( Math.random() * 0xffffff, 1 );
	}else if(analyzer.getLevel() <= 0.12){
		renderer.setClearColor( 0x000000, 1 );
	}else{
		renderer.setClearColor( 0xffffff, 1 );
		
	}
	
	
}

function animateStars(){
	// loop through each star
	for(var i=0; i<stars.length; i++) {

		star = stars[i];

		// move it forward by a 10th of its array position each time
		star.position.z += i/10;

		// once the star is too close, reset its z position
		if(star.position.z>1000) star.position.z-=2000;
	}
}

function animateLines(){
	var rms = analyzer.getLevel();
	var rand = parseInt(Math.random() * particles.length);
	var i = 0;
	for ( var ix = 0; ix < AMOUNTX; ix ++ ) {
		
		for ( var iy = 0; iy < AMOUNTY; iy ++ ) {
			particle = particles[ i++ ];
			if(analyzer.getLevel() >= 0.3){
				particle.material.color.setHex( 0x000000 );
			}else if(analyzer.getLevel() <= 0.12){
				particle.material.color.setHex( 0xffffff );
			}else{
				particle.material.color.setHex( getRandomColor() );
			}
			
			particle.position.y = ( Math.sin( ( ix + count ) * 0.3 ) * (rms * 100)  ) + ( Math.sin( ( iy + count ) * 0.3 ) * (rms * 100));
			particle.scale.x = particle.scale.y = ( Math.sin( ( ix + count ) * 0.5 ) + 1 ) * (rms*2) + ( Math.sin( ( iy + count ) * 0.5 ) + 1 ) * (rms*2);
		}
	}
	
	count += 0.5 * rms;
}
/* ========================[ CONTROLLER ]======================== */
function createScene(){
	addLines();
	addLight();
}
/* =======================[ OBJECTS ]========================= */
function addStar(){
    // The loop will move from z position of -1000 to z position 1000, adding a random particle at each position.
    for ( var z= -1000; z < 1000; z+=20 ) {

		// Make a sphere (exactly the same as before).
		var geometry  = new THREE.SphereGeometry(0.5, 5, 5)
		var material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			wireframe: true,
		});
		var sphere = new THREE.Mesh(geometry, material)

		// This time we give the sphere random x and y positions between -500 and 500
		sphere.position.x = Math.random() * 1000 - 500;
		sphere.position.y = Math.random() * 1000 - 500;

		// Then set the z position to where it is in the loop (distance of camera)
		sphere.position.z = z;

		// scale it up a bit
		sphere.scale.x = sphere.scale.y = 2;

		//add the sphere to the scene
		scene.add(sphere);

		//finally push it to the stars array
		stars.push(sphere);
	}
}

function addLight(){
	// use directional light
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.9);
	// set the position
 	directionalLight.position.set(10, 2, 20);
	// enable shadow
	directionalLight.castShadow = true;
	// enable camera
	directionalLight.shadowCameraVisible = true;

	// add light to the scene
	scene.add( directionalLight );
}
function addLines(){
	particles = new Array();
	var PI2 = Math.PI * 2;
	var material = new THREE.SpriteCanvasMaterial( {
		color: 0xffffff,
		program: function ( context ) {
			context.beginPath();
			context.arc( 0, 0, 0.5, 0, PI2, true );
			context.fill();
		}
	} );
	var i = 0;
	for ( var ix = 0; ix < AMOUNTX; ix ++ ) {
		for ( var iy = 0; iy < AMOUNTY; iy ++ ) {
			particle = particles[ i ++ ] = new THREE.Sprite( material );
			particle.position.x = ix * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 );
			particle.position.z = iy * SEPARATION - ( ( AMOUNTY * SEPARATION ) / 2 );
			scene.add( particle );
		}
	}
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '0x';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}