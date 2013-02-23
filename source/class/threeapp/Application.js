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
      var splitContainer = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      splitContainer.setAppearance("app-main");
      var threeView = new threeapp.ThreeView();
      mainContainer.add(threeView, {flex:1});

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
    }
  }
});
