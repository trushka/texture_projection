import * as THREE from 'three';
import {FBXLoader} from 'jsm/loaders/FBXLoader.js';
import {OrbitControls} from 'jsm/controls/OrbitControls.js';
export {THREE};

export const PI=Math.PI,
	vec2=function(...args) {return new THREE.Vector2(...args)},
	vec3=function(...args) {return new THREE.Vector3(...args)},
	vec4=function(...args) {return new THREE.Vector4(...args)};

export let projSource, projRotation, material, mesh;
export const 
	container=document.querySelector('.workspace'),
	canvas = container.querySelector('canvas'),
	cashed={dpr: 1},

	loader=new FBXLoader(),
	renderer = new THREE.WebGLRenderer( {alpha:true, antialias: true, canvas:canvas} ),
	scene=new THREE.Scene(),
	camera=new THREE.PerspectiveCamera( 50, 1, .1, 10000 ),
	controls = new OrbitControls( camera, canvas );

camera.position.z=5;
controls.screenSpacePanning=false;
controls.panSpeed=15;
controls.rotateSpeed=-.5;
controls.enableZoom=false;
// camera.lookAt(0,0,0);

loader.load('HOUSE_INTERIOR_MESH.fbx', obj=>{
	mesh=obj.children[0];
	material=mesh.material=new THREE.MeshBasicMaterial({
		map: new THREE.TextureLoader().load('map.jpg'),
		side: 2,
		onBeforeCompile: sh=> {
			//console.log(sh);

			//uniforms (can be stored as a vars or object properties and change along with the texture during user navigation):
			sh.uniforms.center = projSource = {value: vec3(0,0,0)};
			sh.uniforms.rotation = projRotation = {value: -.25} // projection y-rotation in turns

			sh.vertexShader=`varying vec3 vPosition;
			uniform vec3 center;
			${sh.vertexShader.replace('void main() {', 'void main() {\n vPosition=position-center;')}`;

			sh.fragmentShader=`varying vec3 vPosition;
			uniform float rotation;
			${sh.fragmentShader.replace('#include <map_fragment>', `
			float posLength = length(vPosition);
			float UVy = asin( clamp( vPosition.y/posLength, -1., 1. ) ) / PI + 0.5;
			float UVx = atan( vPosition.z, vPosition.x ) / PI2;
			diffuseColor *=  texture2D( map, vec2( (fwidth(UVx)>.5 ? fract(UVx) : UVx) + rotation, UVy) );`)}`;
		}
	});
	material.map.anisotropy=renderer.capabilities.getMaxAnisotropy(); //optional, for bettrg quality near the "poles"
	material.map.wrapS=THREE.RepeatWrapping;
	scene.add(mesh);
})

renderer.setAnimationLoop(function(){
	if (!mesh) return;
	if (cashed.dpr!=devicePixelRatio) renderer.setPixelRatio(cashed.dpr=devicePixelRatio);
	const rect = canvas.getBoundingClientRect()
	if (cashed.w!=rect.width || cashed.h!=rect.height) {
		renderer.setSize(cashed.w=rect.width, cashed.h=rect.height, false);
		camera.aspect=rect.width/rect.height;
		camera.updateProjectionMatrix();
	}
	controls.update();
	renderer.render(scene, camera)
})