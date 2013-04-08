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
      if(this.__emitSelectionSignal == true) { 
        var sel = this.__tree.getSelection();
        var arr = sel.toArray();
        var data = []
        for (var i=0; i<arr.length; i++) {
          data.push(arr[i].getName());
        }
        this.fireDataEvent("selection", data);
      }
    }, this);
  },
  events :
  {
    "selection" : "qx.event.type.Data"
  },
  statics :
  {
  },
  members :
  {
    setData : function(treeData) {
      this.__data = qx.data.marshal.Json.createModel(treeData, true);
      this.__tree.setModel(this.__data);
    },
    select : function(items) {
      var lookup = {};
      items.map(function(i) { lookup[i] = 1; });
      var sel = this.__tree.getSelection();
      var traverse = function(d) {
        if (d.getChildren !== undefined) {
          var c = d.getChildren().toArray();
          for (var i = 0; i < c.length; i++) {
            traverse(c[i]);
          }
        } else if (d.getName() in lookup) {
          sel.push(d);
        }
      };
      this.__emitSelectionSignal = false;
      sel.removeAll();
      traverse(this.__data);
      this.__emitSelectionSignal = true;
    },
    __emitSelectionSignal : true,
    __tree : null,
    __data : null
  }
});

