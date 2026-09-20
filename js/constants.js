(function defineConstants(global) {
  "use strict";

  const namespace = (global.FileAlloc = global.FileAlloc || {});

  namespace.Constants = Object.freeze({
    TOTAL_BLOCKS: 64,
    BLOCK_STATUS: Object.freeze({
      FREE: "free",
      USED: "used",
    }),
    BLOCK_ROLE: Object.freeze({
      DATA: "data",
      INDEX: "index",
    }),
    ALLOCATION_TYPE: Object.freeze({
      CONTIGUOUS: "contiguous",
      LINKED: "linked",
      INDEXED: "indexed",
    }),
    FILE_COLORS: Object.freeze([
      "#9db7fa",
      "#f9a8d4",
      "#86efac",
      "#fcd34d",
      "#c4b5fd",
      "#67e8f9",
      "#fdba74",
      "#a7f3d0",
    ]),
  });
})(window);
