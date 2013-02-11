/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/* ************************************************************************

#asset(threeapp/*)

************************************************************************ */

qx.Class.define("threeapp.ThreeView",
{
  extend : qx.ui.core.Widget,

  construct : function()
  {
    this.base(arguments);

this.addListenerOnce("appear", function() {
  var scene = new THREE.Scene();
  //var camera = new THREE.OrthographicCamera(-3, 3, -3, 3);//75, 1.5, 0.1, 1000);
  var camera = new THREE.PerspectiveCamera();//75, 1.5, 0.1, 1000);
  var renderer = new THREE.WebGLRenderer();
  //renderer.setSize(window.innerWidth, window.innerHeight);
  var dom_element = this.getContentElement().getDomElement()
  dom_element.appendChild(renderer.domElement);
  //var geometry = new THREE.CubeGeometry(1,1,1);
  var geometry = new THREE.SphereGeometry(1,24,18);
  var material = new THREE.MeshPhongMaterial({color: 0x0000ff});
  var cube = new THREE.Mesh(geometry, material);
  var light1 = new THREE.DirectionalLight(0xffeedd, 0.8);
  light1.position.set(10,10,0).normalize();
  light1.target = cube;

  var light2 = new THREE.AmbientLight(0x101030);

  scene.add(cube);
  scene.add(light1);
  scene.add(light2);

  camera.position.z = 5;

	var controls = new THREE.TrackballControls( camera, dom_element );
	controls.rotateSpeed = 5.0;
	controls.zoomSpeed = 2.0;
	controls.panSpeed = 2.0;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
	controls.addEventListener( 'change', function () {

		light1.position.copy(camera.position);
		renderer.render(scene, camera);

	} );
  
	function animate() {

		requestAnimationFrame( animate );
		controls.update();

	}


  function render() { requestAnimationFrame(render);
    cube.rotation.x += 0.1;
    cube.rotation.y += 0.1;
    renderer.render(scene, camera);
  }

  function resize(sz) {
    camera.aspect = sz.width / sz.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sz.width, sz.height);
    renderer.render(scene, camera);
  }

  this.addListener("resize", function(data) { resize(data.getData()); }, this);
  animate();
  resize(this.getInnerSize());
}, this);

  },
  members :
  {
  }
});
