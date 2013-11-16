var Emitter = function(){
	THREE.Object3D.call(this);
//	this.position = new THREE.Vector3(0,0,0);
	//this.children = [];
};

//var emitterPos = new THREE.Vector3(.5,.5,.5);

Emitter.prototype = Object.create(THREE.Object3D.prototype);
Emitter.prototype.constructor = Emitter;
Emitter.prototype.addParticle = function(power){
	randVec = new THREE.Vector3(Math.random(), Math.random(), Math.random());
	//var start = emitterPos.add(randVec);
	var pos = emitter.position.clone().add(randVec.multiplyScalar(.001));
	var p = new Particle();
	p.init(power);
	p.setPos(pos.x,pos.y,pos.z);
	p.setMass(Math.random(.8,1.0));
	this.add(p);
	//this.children.push(p);
	//console.log(this.position);
}

// Emitter.prototype.remove = function(obj){
// 	for(var i=0;i<this.children.length;i++){
// 		if(this.children[i].id == obj.id){
// 			this.children.splice(i,1);
// 		}
// 	}
// }
Emitter.prototype.run = function(object){
	if(this.children.length>0){
		for(var i=this.children.length-1;i>0;i--){

			if(this.children[i].isDead()){
				this.remove(this.children[i]);
				//delete this.children[i];
			}else{
				this.children[i].addForce(gravity);
				var total = new THREE.Vector3(0,0,0);
				for(var j=0;j<this.children.length;j++){
					if(i != j){
						total.add(repel(this.children[i].position,this.children[j].position));
						total.add(attract(this.children[i].position,this.children[j].position));
					}
				}
				var orientation = this.position.clone();
				orientation.z -= .2;
				total.add(repel(this.children[i].position,orientation));
				this.children[i].addForce(total);
				this.children[i].update();

				var pow = map(this.children[i].life, 0,120, 0, .15 );

				object.addBall(this.children[i].position.x,
							  this.children[i].position.y,
							  this.children[i].position.z,
							  pow,
							  10);
				// object.addBall(norm.x,
				// 			  norm.y,
				// 			  norm.z,
				// 			  .1,
				// 			  10);
			}
		}
	}
}

var Particle = function() {
	THREE.Object3D.call(this); 
}

Particle.prototype = new THREE.Object3D();


Particle.prototype.init = function(pow){
	this.acceleration = new THREE.Vector3(0,0,0);
	this.velocity = new THREE.Vector3(0,0,0);
	this.power = 0;
	this.power += pow;
	this.life = 70;
}

Particle.prototype.setPos = function(x,y,z){
	this.position.set(x,y,z);
}

Particle.prototype.setMass = function(newMass){
	this.mass = newMass;
}

Particle.prototype.update = function(){


	this.velocity.add(this.acceleration);
	this.velocity.clamp(new THREE.Vector3(-.008,-.008,.008), new THREE.Vector3(.008,.008,.008));
	this.position.add(this.velocity);

	this.acceleration.multiplyScalar(0);

	if(this.life<0)this.life = 0;
	else this.life--;
}

Particle.prototype.isDead = function(){
	if(this.life<0) return true;
	else return false;
}

Particle.prototype.addForce = function(force){
	var f = new THREE.Vector3()
	f = force.clone();
	this.acceleration.add(f.divideScalar(this.mass));
}

var scene;
var renderer;
var mesh;
var camera;
var MARGIN = 0;
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
var light, pointLight, ambientLight;
var vomit, resolution, numBlobs;
var time = 0;
var clock = new THREE.Clock();
var gravity = new THREE.Vector3(0,-.004,0);
var emitter = new Emitter();
var controls;

init();
animate();

function init () {
	var container = document.getElementById("container");
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0x333333, 1 );
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );	
	container.appendChild(renderer.domElement);
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 45, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 50000);
	camera.position.set( -500, 500, 1500 );
	//camera.position.set(0,0,10);
	scene.add(camera);

	light = new THREE.DirectionalLight( 0x3399ee );
	light.position.set( -1., 0, 0 );
	scene.add( light );

	pointLight = new THREE.PointLight( 0xffffff );
	pointLight.position.set( -500, 500, 1500 );
	scene.add( pointLight );

	ambientLight = new THREE.AmbientLight( 0x050505 );
	scene.add( ambientLight );

	resolution = 64;
	numBlobs = 20;

	controls = new THREE.TrackballControls( camera, renderer.domElement );

	var vomitMaterial = new THREE.MeshPhongMaterial( { color: 0x550000, specular: 0x440000, metal: true } );
	vomit = new THREE.MarchingCubes( resolution, vomitMaterial , true, true );
	vomit.position.set( 0, 0, 0 );
	vomit.scale.set( 700, 700, 700 );

	vomit.enableUvs = false;
	vomit.enableColors = false;

	scene.add( vomit );

	emitter.position.set(.5,.75,.5);

	scene.add(emitter);

	//mesh = new THREE.Mesh(new THREE.SphereGeometry(1,32,32), new THREE.MeshBasicMaterial());
	//scene.add(mesh);

	updateCubes( vomit, time, 12, false, false, false );

	window.addEventListener( 'resize', onWindowResize, false );

}

function map(val, inMin,  inMax, outMin, outMax){
	return outMin + (outMax - outMin) * ((val - inMin) / (inMax - inMin));
}

function onWindowResize( event ) {

	SCREEN_WIDTH = window.innerWidth;
	SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;

	camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
	camera.updateProjectionMatrix();
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	
}
var frameCount = 0;
function animate() {

	requestAnimationFrame( animate );
	render();
	frameCount++;
}

function render() {

	var delta = clock.getDelta();
	time += delta * 2 * 0.5;

	//var power = Math.sin(frameCount*(Math.PI/180))*.2;

	//if(frameCount%3==0)
	emitter.addParticle(.1);

	updateCubes( vomit, time, 12, false,false,false );
    
    controls.update( delta );

    
   // console.log(emitter.children.length);
	renderer.render( scene, camera );

}

function updateCubes( object, time, numblobs, floor, wallx, wallz ) {

			object.reset();

			emitter.run(object);
			//object.addBall(.5,.5,.5,1,10);

			if ( floor ) object.addPlaneY( 2, 12 );
			if ( wallz ) object.addPlaneZ( 2, 12 );
			if ( wallx ) object.addPlaneX( 2, 12 );

}






function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

function repel(vec1, vec2){

	// var repos = new THREE.Vector3();
	// repos = vec2.clone();
	// repos.z += .2;
	// repos.y -= .1;
	var repulsion = new THREE.Vector3();
	repulsion.subVectors(vec1,vec2);
	var d = repulsion.length();
	d = clamp(d,.7,.8);
	var f = .000003/(d);
	repulsion.normalize();
	repulsion.multiplyScalar(f);
	// repulsion.clamp(THREE.Vector3(0,0,0),THREE.Vector3(1.,1.,1.))
	return repulsion;

}

function attract(vec1, vec2){

	// var repos = new THREE.Vector3();
	// repos = vec2.clone();
	// repos.z += .2;
	// repos.y -= .1;
	var attract = new THREE.Vector3();
	attract.subVectors(vec1,vec2);
	var d = attract.length();
	d = clamp(d,.01,.95);
	var f = .0000001/(d);
	attract.normalize();
	attract.multiplyScalar(-f);
	// repulsion.clamp(THREE.Vector3(0,0,0),THREE.Vector3(1.,1.,1.))
	return attract;

}

// function cohesion(){
//     PVector sum = new PVector(0,0);   // Start with empty vector to accumulate all locations
//     var count = 0;
//     for (Boid other : boids) {
//       float d = PVector.dist(location,other.location);
//       if ((d > 0) && (d < neighbordist)) {
//         sum.add(other.location); // Add location
//         count++;
//       }
//     }
//     if (count > 0) {
//       sum.div(count);
//       return seek(sum);  // Steer towards the location
//     } else {
//       return new PVector(0,0);
//     }
//   }
// }







