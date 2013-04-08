/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/* ************************************************************************

#asset(threeapp/*)
#asset(threeapp/icons/*)

************************************************************************ */

/**
 * This is the main application class of your custom application "ThreeApp"
 *
 * @ignore(FileReader)
 * @ignore(THREE)
 */
qx.Class.define("threeapp.Application",
{
  extend : qx.application.Standalone,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * This method contains the initial application code and gets called 
     * during startup of the application
     * 
     * @lint ignoreDeprecated(alert)
     */
    main : function()
    {
      // Call super class
      this.base(arguments);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;
        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      /*
      -------------------------------------------------------------------------
        Below is your actual application code...
      -------------------------------------------------------------------------
      */

      // container layout
      var mainContainer = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      this.getRoot().add(mainContainer, { edge : 0 });

      // header
      var headerContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      headerContainer.setAppearance("app-header");
      var title = new qx.ui.basic.Label(this.tr("Threeapp"));
      var desc = new qx.ui.basic.Label(this.tr("demo app with a webgl view"));
      desc.setFont("default");
      headerContainer.add(title);
      headerContainer.add(new qx.ui.core.Spacer(), {flex:1});
      headerContainer.add(desc);
      mainContainer.add(headerContainer);

      // toolbar
      var toolbar = new qx.ui.toolbar.ToolBar();
      toolbar.setShow("icon");
      mainContainer.add(toolbar, {flex:0});

      var resetViewButton = new qx.ui.toolbar.Button(this.tr("Reset view"), "threeapp/icons/pqResetCamera24.png");
      resetViewButton.setToolTipText(this.tr("Reset the view"));
      toolbar.add(resetViewButton);

      var xPlusButton = new qx.ui.toolbar.Button(this.tr("+X"), "threeapp/icons/pqXPlus24.png");
      xPlusButton.setToolTipText(this.tr("Set view direction to +X"));
      toolbar.add(xPlusButton);
      var xMinusButton = new qx.ui.toolbar.Button(this.tr("-X"), "threeapp/icons/pqXMinus24.png");
      xMinusButton.setToolTipText(this.tr("Set view direction to +X"));
      toolbar.add(xMinusButton);
      var yPlusButton = new qx.ui.toolbar.Button(this.tr("+Y"), "threeapp/icons/pqYPlus24.png");
      yPlusButton.setToolTipText(this.tr("Set view direction to +Y"));
      toolbar.add(yPlusButton);
      var yMinusButton = new qx.ui.toolbar.Button(this.tr("-Y"), "threeapp/icons/pqYMinus24.png");
      yMinusButton.setToolTipText(this.tr("Set view direction to +Y"));
      toolbar.add(yMinusButton);
      var zPlusButton = new qx.ui.toolbar.Button(this.tr("+Z"), "threeapp/icons/pqZPlus24.png");
      zPlusButton.setToolTipText(this.tr("Set view direction to +Z"));
      toolbar.add(zPlusButton);
      var zMinusButton = new qx.ui.toolbar.Button(this.tr("-Z"), "threeapp/icons/pqZMinus24.png");
      zMinusButton.setToolTipText(this.tr("Set view direction to -Z"));
      toolbar.add(zMinusButton);

      // main section
      var mainSplit = new qx.ui.splitpane.Pane("horizontal");
      mainContainer.add(mainSplit, {flex:1});

      // TODO: use TreeVirtual as it provides columns
      var objectInspector = new threeapp.ui.ObjectInspector();
      mainSplit.add(objectInspector, 1);

      var threeView = new threeapp.ThreeView();
      //console.log(threeView.getBackgroundColor());
      //console.log(threeView.getBackgroundAlpha());
      //threeView.setBackgroundColor("0xff0000",1.0);
      mainSplit.add(threeView, 5);

      objectInspector.addListener("selection", function(d) { threeView.select(d.getData()); }, this);
      threeView.addListener("selection", function(d) { objectInspector.select(d.getData()); }, this);

      // footer
      var footerContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      footerContainer.setAppearance("app-footer");
      var footerText = new qx.ui.basic.Label(this.tr("Paul Edwards"));
      footerContainer.add(new qx.ui.core.Spacer(), {flex:1});
      footerContainer.add(footerText);
      mainContainer.add(footerContainer);


      // update logic
      resetViewButton.addListener("execute", function() { threeView.resetView(); }, this);
      xPlusButton.addListener("execute", function() { threeView.resetViewOnAxis(threeapp.ThreeView.AXIS.X, 1); }, this );
      xMinusButton.addListener("execute", function() { threeView.resetViewOnAxis(threeapp.ThreeView.AXIS.X, -1); }, this );
      yPlusButton.addListener("execute", function() { threeView.resetViewOnAxis(threeapp.ThreeView.AXIS.Y, 1); }, this );
      yMinusButton.addListener("execute", function() { threeView.resetViewOnAxis(threeapp.ThreeView.AXIS.Y, -1); }, this );
      zPlusButton.addListener("execute", function() { threeView.resetViewOnAxis(threeapp.ThreeView.AXIS.Z, 1); }, this );
      zMinusButton.addListener("execute", function() { threeView.resetViewOnAxis(threeapp.ThreeView.AXIS.Z, -1); }, this );

      // allow file drop in 3D view
      document.addEventListener("drop", function(event) {
        event.preventDefault();
	var file = event.dataTransfer.files[0];

	var chunks = file.name.split(".");
	var extension = chunks.pop().toLowerCase();
	var filename = chunks.join(".");

	var reader = new FileReader();
	reader.addEventListener("load", function(event) { 
          var contents = event.target.result; 
          var object = null;
          switch(extension) {
            case 'obj': 
              object = new THREE.OBJLoader().parse(contents);
              break;
            case 'stl':
              var geometry = new THREE.STLLoader().parseASCII(contents);
              geometry.sourceType = "stl";
              geometry.sourceFile = file.name;
              geometry.computeCentroids();
              geometry.computeFaceNormals();
              geometry.computeBoundingSphere();
              var material = new THREE.MeshLambertMaterial();
              material.side = THREE.DoubleSide;
              var mesh = new THREE.Mesh(geometry, material);
              mesh.name = filename;
              object = new THREE.Object3D();
              object.add(mesh);
              break;
          }
          if(object !== null) {
            object.name = filename;
            threeView.addObject(object);
            var makeTreeData = function(obj) {
              var data = {name:obj.name};
              if (obj.children.length > 0) {
                data.children = [];
                for(var i=0; i<obj.children.length; i++) {
                  data.children.push(makeTreeData(obj.children[i]));
                }
              }
              return data;
            }
            var treeData = makeTreeData(object);
            objectInspector.setData(treeData);
          }
	}, false);
        reader.readAsText(file);
      }, false);
    }
  }
});
