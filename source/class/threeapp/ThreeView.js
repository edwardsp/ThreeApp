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

    this.__timer = new qx.event.Timer();
    this.__timer.setInterval(50);

    this._scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera();
    this._renderer = new THREE.WebGLRenderer();
    this._light1 = new THREE.DirectionalLight(0xffeedd, 0.8);
    this._light2 = new THREE.AmbientLight(0x101030);

    this._scene.add(this._light1);
    this._scene.add(this._light2);

    this.addListener("resize", this.resize, this);
    this.__timer.addListener("interval", this.__animate, this);

    this.addListener("mousedown", this.__mousedown, this);
    this.addListener("mousewheel", this.__mousewheel, this);
    this.capture(true);

    this.addListenerOnce("appear", function() {
      var qxThis = this;
      var dom_element = this.getContentElement().getDomElement()
      dom_element.appendChild(this._renderer.domElement);
/*
      this._controls = new THREE.TrackballControls(this._camera, dom_element);
      this._controls.rotateSpeed = 5.0;
      this._controls.zoomSpeed = 2.0;
      this._controls.panSpeed = 2.0;
      this._controls.noZoom = false;
      this._controls.noPan = false;
      this._controls.staticMoving = true;
      this._controls.dynamicDampingFactor = 0.3;
      this._controls.addEventListener('change', function() { qxThis.__render(); }, false);
*/
      document.addEventListener( 'drop', function ( event ) {
        event.preventDefault();
	var file = event.dataTransfer.files[ 0 ];

	var chunks = file.name.split( '.' );
	var extension = chunks.pop().toLowerCase();
	var filename = chunks.join( '.' );

	var reader = new FileReader();
	reader.addEventListener( 'load', function ( event ) { 
          var contents = event.target.result; 
	  qxThis._object = new THREE.OBJLoader().parse( contents );                                                  
	  qxThis._object.name = filename;
	  qxThis._scene.add(qxThis._object);
	  qxThis._object.children[0].geometry.computeBoundingSphere();
		
	  var pos = qxThis._object.children[0].geometry.boundingSphere.center;
	  var r = qxThis._object.children[0].geometry.boundingSphere.radius;
	  qxThis._camera.position.set(pos.x + 2*r, pos.y, pos.z);
qxThis.__render();
	}, false );

        reader.readAsText(file);
      }, false );

      this.resize(this.getInnerSize());
      this.__timer.start();

    }, this);
  },
  statics :
  {
    STATE : { NONE : 0, ROTATE : 1, ZOOM : 2, PAN : 3 }
  },
  members :
  {
    resize : function(sz) {
      if (this._camera !== null && this._renderer !== null) {
        this._camera.aspect = sz.width / sz.height;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(sz.width, sz.height);
        this._renderer.render(this._scene, this._camera);
      }

      // for controls
      this.__screen.width = sz.width;
      this.__screen.height = sz.height;
      this.__screen.offsetLeft = 0;
      this.__screen.offsetTop = 0;
      this.__radius = (sz.width + sz.height) / 4;
    },
    __mousedown : function(mouseEvent) {
      //var btn = mouseEvent.getButton();
      if (this.__ctrlState == threeapp.ThreeView.STATE.NONE) {
        if (mouseEvent.isLeftPressed()) {
          this.__ctrlState = threeapp.ThreeView.STATE.ROTATE;
        }
        else if (mouseEvent.isMiddlePressed()) {
          this.__ctrlState = threeapp.ThreeView.STATE.PAN;
        }
        else if (mouseEvent.isRightPressed()) {
          this.__ctrlState = threeapp.ThreeView.STATE.ZOOM;
        }
      }

      if (this.__ctrlState == threeapp.ThreeView.STATE.ROTATE) {
        this.__rotateStart = this.__rotateEnd = this._getMouseProjectionOnBall(
          mouseEvent.getViewportLeft(), mouseEvent.getViewportTop());
      }
      else if (this.__ctrlState == threeapp.ThreeView.STATE.PAN) {
        this.__panStart = this.__panEnd = this._getMouseOnScreen(
          mouseEvent.getViewportLeft(), mouseEvent.getViewportTop());
      }
      else if (this.__ctrlState == threeapp.ThreeView.STATE.ZOOM) {
        this.__zoomStart = this.__zoomEnd = this._getMouseOnScreen(
          mouseEvent.getViewportLeft(), mouseEvent.getViewportTop());
      }

      this.addListener("mouseup", this.__mouseup, this);
      this.addListener("mousemove", this.__mousemove, this);
    },
    __mousemove : function(mouseEvent) {
      if (this.__ctrlState == threeapp.ThreeView.STATE.ROTATE) {
        this.__rotateEnd = this._getMouseProjectionOnBall(
          mouseEvent.getViewportLeft(), mouseEvent.getViewportTop());
      }
      else if (this.__ctrlState == threeapp.ThreeView.STATE.PAN) {
        this.__panEnd = this._getMouseOnScreen(
          mouseEvent.getViewportLeft(), mouseEvent.getViewportTop());
      }
      else if (this.__ctrlState == threeapp.ThreeView.STATE.ZOOM) {
        this.__zoomEnd = this._getMouseOnScreen(
          mouseEvent.getViewportLeft(), mouseEvent.getViewportTop());
      }
    },
    __mouseup : function(mouseEvent) {
      this.__ctrlState = threeapp.ThreeView.STATE.NONE;
      this.removeListener("mouseup", this.__mouseup, this);
      this.removeListener("mousemove", this.__mousemove, this);
    },
    __mousewheel : function(mouseWheel) {
      console.log("mousewheel: " + mouseWheel.getWheelDelta());
    },
    _getMouseProjectionOnBall : function(x, y) {
      var mouseOnBall = new THREE.Vector3(
        (x - this.__screen.width * 0.5 - this.__screen.offsetLeft) / this.__radius,
        (this.__screen.height * 0.5 + this.__screen.offsetTop - y) / this.__radius,
        0.0);
      var length = mouseOnBall.length();
      if(length > 1.0) {
        mouseOnBall.normalize();
      } else {
        mouseOnBall.z = Math.sqrt(1.0 - length * length);
      }
      this.__eye.copy(this._camera.position).sub(this.__target);
      var projection = this._camera.up.clone().setLength(mouseOnBall.y);
      projection.add(this._camera.up.clone().cross(this.__eye).setLength(mouseOnBall.x));
      projection.add(this.__eye.setLength(mouseOnBall.z));
      return projection;  
    },
    _getMouseOnScreen : function(x, y) {
      return new THREE.Vector2( 
        (x - this.__screen.offsetLeft) / (this.__radius * 0.5),
        (y - this.__screen.offsetTop) / (this.__radius * 0.5));
    },
    __render : function() {
      if(this._object !== null) {
        this._light1.target = this._object;
      }
      this._light1.position.copy(this._camera.position);
      this._renderer.render(this._scene, this._camera);
    }, 
    __rotateCamera : function() {
      var angle = Math.acos(this.__rotateStart.dot(this.__rotateEnd) / this.__rotateStart.length() / this.__rotateEnd.length());
      if(angle) {
        var axis = (new THREE.Vector3()).crossVectors(this.__rotateStart, this.__rotateEnd).normalize();
        var quaternion = new THREE.Quaternion();
        angle *= this.__rotateSpeed;
        quaternion.setFromAxisAngle(axis, -angle);
        this.__eye.applyQuaternion(quaternion);
        this._camera.up.applyQuaternion(quaternion);
        this.__rotateEnd.applyQuaternion(quaternion);
        if(this.__staticMoving) {
          this.__rotateStart.copy(this.__rotateEnd);
        } else {
          quaternion.setFromAxisAngle(axis, angle * (this.__dynamicDampingFactor - 1.0));
          this.__rotateStart.applyQuaternion(quaternion);
        }
      }
    },
    __panCamera : function() {
      var mouseChange = this.__panEnd.clone().sub(this.__panStart);
      if(mouseChange.lengthSq()) {
        mouseChange.multiplyScalar(this.__eye.length() * this.__panSpeed);
        var pan = this.__eye.clone().cross(this._camera.up).setLength(mouseChange.x);
        pan.add(this._camera.up.clone().setLength(mouseChange.y));
        this._camera.position.add(pan);
        this.__target.add(pan);
        if(this.__staticMoving) {
          this.__panStart = this.__panEnd;
        } else {
          this.__panStart.add(mouseChange.subVectors(this.__panEnd, this.__panStart).multiplyScalar(this.__dynamicDampingFactor));
        }
      }
    },
    __zoomCamera : function() {
      var factor = 1.0 + (this.__zoomEnd.y - this.__zoomStart.y) * this.__zoomSpeed;
      if(factor != 1.0 && factor > 0.0) {
        this.__eye.multiplyScalar(factor);
        if(this.__staticMoving) {
          this.__zoomStart.copy(this.__zoomEnd);
        } else {
          this.__zoomStart.y += (this.__zoomEnd.y - this.__zoomStart.y) * this.__dynamicDampingFactor;
        }
      }
    },
    __checkDistances : function() {
      if(this._camera.position.lengthSq() > this.__maxDistance * this.__maxDistance) {
        this._camera.position.setLength(this.__maxDistance);
      }
      if(this.__eye.lengthSq() < this.__minDistance * this.__minDistance) {
        this._camera.position.addVectors(this.__target, this.__eye.setLength(this.__minDistance));
      }
    },
    __update : function() {
      this.__eye.subVectors(this._camera.position, this.__target);
      this.__rotateCamera();
      this.__panCamera();
      this.__zoomCamera();
      this._camera.position.addVectors(this.__target, this.__eye);
      this.__checkDistances();
      this._camera.lookAt(this.__target);
      if(this.__lastPosition.distanceToSquared(this._camera.position) > 0) {
        this.__render();
        this.__lastPosition.copy(this._camera.position);
      }
    },
    __animate : function() {
      this.__update();
      //this._controls.update();
    },
    __timer : null,
    _scene : null,
    _camera : null,
    _renderer : null,
    _object : null,
    _controls : null,
    _light1 : null,
    _light2 : null,

    // members required for movement
    __ctrlState : 0, //threeapp.ThreeView.STATE.NONE,
    __eye : new THREE.Vector3(),
    __target : new THREE.Vector3(),
    __lastPosition : new THREE.Vector3(),
    __screen : { width:0, height:0, offsetLeft:0, offsetTop:0 },
    __radius : 1.0,
    __minDistance : 0,
    __maxDistance : Infinity,
    __staticMoving : true,
    __dynamicDampingFactor : 0.2,
    __rotateSpeed : 5.0,
    __panSpeed : 2.0,
    __zoomSpeed : 2.0,
    __rotateStart : new THREE.Vector3(),
    __rotateEnd : new THREE.Vector3(),
    __panStart : new THREE.Vector2(),
    __panEnd : new THREE.Vector2(),
    __zoomStart : new THREE.Vector2(),
    __zoomEnd : new THREE.Vector2()
  }
});
