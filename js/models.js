(function defineModels(global) {
  "use strict";

  const namespace = (global.FileAlloc = global.FileAlloc || {});
  const { BLOCK_STATUS } = namespace.Constants;

  function createBlock(id) {
    return {
      id,
      status: BLOCK_STATUS.FREE,
      fileId: null,
      role: null,
      nextBlockId: null,
    };
  }

  function createDisk(totalBlocks) {
    return {
      totalBlocks,
      blocks: Array.from({ length: totalBlocks }, (_, id) => createBlock(id)),
    };
  }

  function createFileRecord({ id, name, size, allocationType, color, allocation }) {
    return {
      id,
      name,
      size,
      allocationType,
      color,
      allocation,
    };
  }

  namespace.Models = Object.freeze({
    createBlock,
    createDisk,
    createFileRecord,
  });
})(window);
