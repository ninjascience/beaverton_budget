// Filename: libs/d3/d3wrap
define(['libs/d3/d3'], function(){
  // Now that all the orignal source codes have ran and accessed each other
  // We can call noConflict() to remove them from the global name space
  // Require.js will keep a reference to them so we can use them in our modules
  return d3;
});