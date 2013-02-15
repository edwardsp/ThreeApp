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
  var dom_element = this.getContentElement().getDomElement()
  dom_element.appendChild(renderer.domElement);
  var object = null;
  var light1 = new THREE.DirectionalLight(0xffeedd, 0.8);
  var light2 = new THREE.AmbientLight(0x101030);

  scene.add(light1);
  scene.add(light2);

	var controls = new THREE.TrackballControls( camera, dom_element );
	controls.rotateSpeed = 5.0;
	controls.zoomSpeed = 2.0;
	controls.panSpeed = 2.0;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
	controls.addEventListener( 'change', function () {

		if(object !== null) {
	  		light1.target = object;
		}
		light1.position.copy(camera.position);
		renderer.render(scene, camera);

	} );
  
	function animate() {

		requestAnimationFrame( animate );
		controls.update();

	}


	document.addEventListener( 'drop', function ( event ) {
		event.preventDefault();
		var file = event.dataTransfer.files[ 0 ];

		var chunks = file.name.split( '.' );
		var extension = chunks.pop().toLowerCase();
		var filename = chunks.join( '.' );

	var reader = new FileReader();
	reader.addEventListener( 'load', function ( event ) { 
		var contents = event.target.result; 
		object = new THREE.OBJLoader().parse( contents );                                                  
		object.name = filename;
		scene.add(object);
		object.children[0].geometry.computeBoundingSphere();
		
		var pos = object.children[0].geometry.boundingSphere.center;
		var r = object.children[0].geometry.boundingSphere.radius;
		camera.position.set(pos.x + 2*r, pos.y, pos.z);
	}, false );

	reader.readAsText(file);
	}, false );



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
