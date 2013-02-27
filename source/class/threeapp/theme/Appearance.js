/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

qx.Theme.define("threeapp.theme.Appearance",
{
  extend : qx.theme.modern.Appearance,

  appearances :
  {
    "app-footer" :
    {
      style : function(states)
      {
        return {
          //font : "bold",
          textColor : "text-selected",
          padding : [4, 12],
          decorator : "app-header"
        };
      }
    }
  }
});
