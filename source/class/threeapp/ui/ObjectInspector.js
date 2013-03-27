/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/* ************************************************************************

#asset(threeapp/*)

************************************************************************ */

qx.Class.define("threeapp.ui.ObjectInspector",
{
  extend : qx.ui.container.Composite,

  construct : function()
  {
    this.base(arguments);
    this.setLayout(new qx.ui.layout.HBox());
    this.__tree = new qx.ui.tree.VirtualTree(null, "name", "children");
    this.__tree.setSelectionMode("multi");
    this.add(this.__tree, {flex:1});
    this.__tree.getSelection().addListener("change", function(e) {
      var sel = this.__tree.getSelection();
      console.log(sel.toArray());
      this.debug("Selection: " + this.__tree.getSelection().getItem(0).getName());
    }, this);
  },
  statics :
  {
  },
  members :
  {
    setData : function(treeData) {
      this.__tree.setModel(qx.data.marshal.Json.createModel(treeData, true));
    },
    __tree : null
  }
});

