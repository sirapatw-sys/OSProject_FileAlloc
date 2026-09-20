(function startApplication(global) {
  "use strict";

  const namespace = global.FileAlloc;
  const simulation = new namespace.Simulation();
  const ui = new namespace.UI(simulation);

  // Exposed for inspection during development and classroom demonstrations.
  namespace.app = Object.freeze({ simulation, ui });
})(window);
