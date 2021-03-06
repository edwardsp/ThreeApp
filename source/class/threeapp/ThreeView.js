/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/* ************************************************************************

#asset(threeapp/*)

************************************************************************ */

/** 
  * @ignore(THREE) 
  */ 
qx.Class.define("threeapp.ThreeView",
{
  extend : qx.ui.core.Widget,

  construct : function()
  {
    this.base(arguments);

    // movemovent
    this.__position = new THREE.Vector3();
    this.__eye = new THREE.Vector3();
    this.__target = new THREE.Vector3();
    this.__lastPosition = new THREE.Vector3();
    this.__rotateStart = new THREE.Vector3();
    this.__rotateEnd = new THREE.Vector3();
    this.__panStart = new THREE.Vector2();
    this.__panEnd = new THREE.Vector2();
    this.__zoomStart = new THREE.Vector2();
    this.__zoomEnd = new THREE.Vector2();
    // selection
    this.__projector = new THREE.Projector();
    this.__ray = new THREE.Raycaster();
    // view
    this.__scene = new THREE.Scene();
    this.__camera = new THREE.PerspectiveCamera();
    this.__renderer = new THREE.WebGLRenderer();
    this.__light1 = new THREE.DirectionalLight(0xffeedd, 0.8);
    this.__light2 = new THREE.AmbientLight(0x101030);

    this.__scene.add(this.__light1);
    this.__scene.add(this.__light2);

    this.addListener("mousedown", this.__mousedown, this);
    this.addListener("mousewheel", this.__mousewheel, this);
    this.addListener("resize", this.__resize, this);


    this.__highlightMaterial = new THREE.MeshLambertMaterial();
    this.__highlightMaterial.side = THREE.DoubleSide;
    this.__highlightMaterial.color.setRGB(1,0,0);


    this.addListenerOnce("appear", function(e) {
      var dom_element = this.getContentElement().getDomElement()
      dom_element.appendChild(this.__renderer.domElement);
    }, this);
  },
  events :
  {
    "selection" : "qx.event.type.Data"
  },
  statics :
  {
    STATE : { NONE : 0, ROTATE : 1, ZOOM : 2, PAN : 3, PICK : 4, PICK_THROUGH : 5 },
    AXIS : { X : 0, Y : 1, Z : 2 }
  },
  members :
  {
    addObject : function(obj) {
      if(this.__object !== null) {
        this.__scene.remove(this.__object);
      }
      this.__object = obj;
      this.__scene.add(this.__object);
      this.resetViewOnAxis(this.self(arguments).AXIS.X, 1);
    },
    getObjectStructure : function() {
      var names = [];
      if(this.__object !== null) {
        var st = [];
        var func = function(obj) {
          st.push(obj.name);
          if(obj.children.length === 0) {
            names.push(st.join("."));
          } else {
            for(var i=0, l=obj.children.length; i<l; i++) {
              func(obj.children[i]);
            }
          }
          st.pop()
        }
        func(this.__object);
      }
      return names;
    },
    getBoundingSphere : function() {
      var bbox = new THREE.Box3();
      if(this.__object !== null) {
        this.__object.traverse(function(child) {
          if(child instanceof THREE.Mesh) {
            if(child.geometry.boundingBox === null) {
              child.geometry.computeBoundingBox();
            }
            bbox.union(child.geometry.boundingBox);
          }
        });
      }
      return bbox.getBoundingSphere().clone();
    },
    resetView : function() {
      var bsphere = this.getBoundingSphere();

      var v = this.__target.clone();
      v.sub(this.__camera.position.clone()).normalize().multiplyScalar(2.0*bsphere.radius);
      
      this.__target.copy(bsphere.center);
      this.__camera.position.copy(bsphere.center).sub(v);
      this.__update();
    },
    resetViewOnAxis : function(axis, direction) {
      var bsphere = this.getBoundingSphere();
      var offset = 2 * bsphere.radius;
      if(direction<0.0) {
        offset = -offset;
      }
 
      if(axis == this.self(arguments).AXIS.X) {
        this.__camera.position.set(bsphere.center.x + offset, bsphere.center.y, bsphere.center.z);
        this.__camera.up.set(0.0,0.0,1.0);
      } else if(axis == this.self(arguments).AXIS.Y) {
        this.__camera.position.set(bsphere.center.x, bsphere.center.y + offset, bsphere.center.z);
        this.__camera.up.set(0.0,0.0,1.0);
      } else if(axis == this.self(arguments).AXIS.Z) {
        this.__camera.position.set(bsphere.center.x, bsphere.center.y, bsphere.center.z + offset);
        this.__camera.up.set(0.0,1.0,0.0);
      }
      this.__target.copy(bsphere.center);
      this.__update();
    },
    __resize : function(e) {
      var sz = e.getData();
      if (this.__camera !== null && this.__renderer !== null) {
        this.__camera.aspect = sz.width / sz.height;
        this.__camera.updateProjectionMatrix();
        this.__renderer.setSize(sz.width, sz.height);
        this.__renderer.render(this.__scene, this.__camera);
      }
    },
    setBackgroundColor : function(color, opacity) {
      this.__renderer.setClearColorHex(color, opacity !== undefined ? opacity : 1);
    },
    getBackgroundColor : function() {
      return this.__renderer.getClearColor().getHex();
    },
    getBackgroundAlpha : function() {
      return this.__renderer.getClearAlpha();
    },
    __mousedown : function(mouseEvent) {
      var box = this.getContainerLocation();
      var w = box.right - box.left;
      var h = box.bottom - box.top;
      var r = (h + w) / 4;
      var mx = mouseEvent.getViewportLeft() - box.left;
      var my = mouseEvent.getViewportTop() - box.top;
      if (this.__ctrlState == this.self(arguments).STATE.NONE) {
        if (mouseEvent.getModifiers() & qx.event.type.Dom.CTRL_MASK) {
          this.__ctrlState = this.self(arguments).STATE.PICK;
        }
        else if (mouseEvent.getModifiers() & qx.event.type.Dom.SHIFT_MASK) {
          this.__ctrlState = this.self(arguments).STATE.PICK_THROUGH;
        }
        else if (mouseEvent.isLeftPressed()) {
          this.__ctrlState = this.self(arguments).STATE.ROTATE;
        }
        else if (mouseEvent.isMiddlePressed()) {
          this.__ctrlState = this.self(arguments).STATE.PAN;
        }
        else if (mouseEvent.isRightPressed()) {
          this.__ctrlState = this.self(arguments).STATE.ZOOM;
        }
      }

      if (this.__ctrlState == this.self(arguments).STATE.ROTATE) {
        this.capture(true);
        this.__rotateStart = this.__rotateEnd = this._getMouseProjectionOnBall(mx,my,w,h,r);
        this.addListener("mouseup", this.__mouseup, this);
        this.addListener("mousemove", this.__mousemove, this);
      }
      else if (this.__ctrlState == this.self(arguments).STATE.PAN) {
        this.capture(true);
        this.__panStart = this.__panEnd = this._getMouseOnScreen(mx,my,r);
        this.addListener("mouseup", this.__mouseup, this);
        this.addListener("mousemove", this.__mousemove, this);
      }
      else if (this.__ctrlState == this.self(arguments).STATE.ZOOM) {
        this.capture(true);
        this.__zoomStart = this.__zoomEnd = this._getMouseOnScreen(mx,my,r);
        this.addListener("mouseup", this.__mouseup, this);
        this.addListener("mousemove", this.__mousemove, this);
      }
      else if (this.__ctrlState == this.self(arguments).STATE.PICK || this.__ctrlState == this.self(arguments).STATE.PICK_THROUGH) {
        if(this.__picked !== null) {
          for (var p in this.__picked) { this.__picked[p][0].material = this.__picked[p][1]; }
          this.__picked = null;
        }
        if(this.__object !== null) {
          var vector = new THREE.Vector3((mx/w)*2-1,-(my/h)*2+1,0.5);
          this.__projector.unprojectVector(vector, this.__camera);
          this.__ray.set(this.__camera.position, vector.sub(this.__camera.position).normalize());
          var objects = [this.__object];
          var intersects = this.__ray.intersectObjects(objects, true);
          var l = intersects.length;
          if(l > 0) {
            this.__picked = {};
            if(this.__ctrlState == this.self(arguments).STATE.PICK) {
              l = 1;
            }
            for(var p=0; p<l; p++) {
              var obj = intersects[p].object;
              if (!this.__picked.hasOwnProperty(obj.name)) {
                console.log(obj.name);
                this.__picked[obj.name] = [obj, obj.material];
                obj.material = this.__highlightMaterial;
              }
            }
            var data = [];
            for(var k in this.__picked) { data.push(k); }
            this.fireDataEvent("selection", data);
          }
        }
        this.__renderer.render(this.__scene, this.__camera);
        this.__ctrlState = this.self(arguments).STATE.NONE;
      }
    },
    select : function(items) {
      var lookup = {};
      items.map(function(i) { lookup[i] = 1; });
      if(this.__picked !== null) {
        for (var p in this.__picked) { this.__picked[p][0].material = this.__picked[p][1]; }
        this.__picked = null;
      }
      var qxThis = this;
      this.__picked = {};
      this.__object.traverse(function(obj) {
        if ((obj.children.length == 0) && obj.name in lookup) {
          qxThis.__picked[obj.name] = [obj, obj.material];
          obj.material = qxThis.__highlightMaterial;
        }
      });
      this.__renderer.render(qxThis.__scene, qxThis.__camera);
    },
    __mousemove : function(mouseEvent) {
      var box = this.getContainerLocation();
      var w = box.right - box.left;
      var h = box.bottom - box.top;
      var r = (h + w) / 4;
      var mx = mouseEvent.getViewportLeft() - box.left;
      var my = mouseEvent.getViewportTop() - box.top;
      if (this.__ctrlState == this.self(arguments).STATE.ROTATE) {
        this.__rotateEnd = this._getMouseProjectionOnBall(mx,my,w,h,r);
      }
      else if (this.__ctrlState == this.self(arguments).STATE.PAN) {
        this.__panEnd = this._getMouseOnScreen(mx,my,r);
      }
      else if (this.__ctrlState == this.self(arguments).STATE.ZOOM) {
        this.__zoomEnd = this._getMouseOnScreen(mx,my,r);
      }
      this.__update();
    },
    __mouseup : function(mouseEvent) {
      this.__ctrlState = this.self(arguments).STATE.NONE;
      this.removeListener("mouseup", this.__mouseup, this);
      this.removeListener("mousemove", this.__mousemove, this);
      this.__update();
    },
    __mousewheel : function(mouseWheel) {
      this.__zoomStart.y += (1 / mouseWheel.getWheelDelta()) * 0.05;
      this.__update();
    },
    _getMouseProjectionOnBall : function(x, y, w, h, r) {
      var mouseOnBall = new THREE.Vector3((x-(w*0.5))/r, ((h*0.5)-y)/r, 0.0);
      var length = mouseOnBall.length();
      if(length > 1.0) {
        mouseOnBall.normalize();
      } else {
        mouseOnBall.z = Math.sqrt(1.0 - length * length);
      }
      this.__eye.copy(this.__camera.position).sub(this.__target);
      var projection = this.__camera.up.clone().setLength(mouseOnBall.y);
      projection.add(this.__camera.up.clone().cross(this.__eye).setLength(mouseOnBall.x));
      projection.add(this.__eye.setLength(mouseOnBall.z));
      return projection;  
    },
    _getMouseOnScreen : function(x, y, r) {
      return new THREE.Vector2(x / (r*0.5), y / (r*0.5));
    },
    __rotateCamera : function() {
      var angle = Math.acos(this.__rotateStart.dot(this.__rotateEnd) / this.__rotateStart.length() / this.__rotateEnd.length());
      if(angle) {
        var axis = (new THREE.Vector3()).crossVectors(this.__rotateStart, this.__rotateEnd).normalize();
        var quaternion = new THREE.Quaternion();
        angle *= this.__rotateSpeed;
        quaternion.setFromAxisAngle(axis, -angle);
        this.__eye.applyQuaternion(quaternion);
        this.__camera.up.applyQuaternion(quaternion);
        this.__rotateEnd.applyQuaternion(quaternion);
        this.__rotateStart.copy(this.__rotateEnd);
      }
    },
    __panCamera : function() {
      var mouseChange = this.__panEnd.clone().sub(this.__panStart);
      if(mouseChange.lengthSq()) {
        mouseChange.multiplyScalar(this.__eye.length() * this.__panSpeed);
        var pan = this.__eye.clone().cross(this.__camera.up).setLength(mouseChange.x);
        pan.add(this.__camera.up.clone().setLength(mouseChange.y));
        this.__camera.position.add(pan);
        this.__target.add(pan);
	this.__panStart = this.__panEnd;
      }
    },
    __zoomCamera : function() {
      var factor = 1.0 + (this.__zoomEnd.y - this.__zoomStart.y) * this.__zoomSpeed;
      if(factor != 1.0 && factor > 0.0) {
        this.__eye.multiplyScalar(factor);
	this.__zoomStart.copy(this.__zoomEnd);
      }
    },
    __checkDistances : function() {
      if(this.__camera.position.lengthSq() > this.__maxDistance * this.__maxDistance) {
        this.__camera.position.setLength(this.__maxDistance);
      }
      if(this.__eye.lengthSq() < this.__minDistance * this.__minDistance) {
        this.__camera.position.addVectors(this.__target, this.__eye.setLength(this.__minDistance));
      }
    },
    __update : function() {
      if(this.__object !== null) {
        this.__eye.subVectors(this.__camera.position, this.__target);
        this.__rotateCamera();
        this.__panCamera();
        this.__zoomCamera();
        this.__camera.position.addVectors(this.__target, this.__eye);
        this.__checkDistances();
        this.__camera.lookAt(this.__target);
        if(this.__lastPosition.distanceToSquared(this.__camera.position) > 0) {
          this.__light1.target = this.__object;
          this.__light1.position.copy(this.__camera.position);
          this.__renderer.render(this.__scene, this.__camera);
          this.__lastPosition.copy(this.__camera.position);
        }
      }
    },
    __scene : null,
    __camera : null,
    __renderer : null,
    __object : null,
    __controls : null,
    __light1 : null,
    __light2 : null,

    // members required for movement
    __position : null,
    __ctrlState : 0,//this.self(arguments).STATE.NONE,
    __eye : null,
    __target : null,
    __lastPosition : null,
    __radius : 1.0,
    __minDistance : 0,
    __maxDistance : Infinity,
    __rotateSpeed : 5.0,
    __panSpeed : 2.0,
    __zoomSpeed : 2.0,
    __rotateStart : null,
    __rotateEnd : null,
    __panStart : null,
    __panEnd : null,
    __zoomStart : null,
    __zoomEnd : null,

    // members for selection
    __projector : null,
    __ray : null,
    __picked : null,
    __highlightMaterial : null
  }
});
