(function defineAllocators(global) {
  "use strict";

  const namespace = (global.FileAlloc = global.FileAlloc || {});
  const { BLOCK_STATUS, ALLOCATION_TYPE } = namespace.Constants;

  function getFreeBlockIds(disk) {
    return disk.blocks
      .filter((block) => block.status === BLOCK_STATUS.FREE)
      .map((block) => block.id);
  }

  function shuffle(values, random = Math.random) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function failure(errorCode, message) {
    return { success: false, errorCode, message };
  }

  function allocateContiguous(disk, size) {
    let runStart = -1;
    let runLength = 0;

    for (const block of disk.blocks) {
      if (block.status === BLOCK_STATUS.FREE) {
        if (runLength === 0) {
          runStart = block.id;
        }
        runLength += 1;

        if (runLength === size) {
          return {
            success: true,
            allocationType: ALLOCATION_TYPE.CONTIGUOUS,
            startBlock: runStart,
            length: size,
            dataBlockIds: Array.from({ length: size }, (_, offset) => runStart + offset),
          };
        }
      } else {
        runStart = -1;
        runLength = 0;
      }
    }

    const totalFree = getFreeBlockIds(disk).length;
    if (totalFree >= size) {
      return failure(
        "EXTERNAL_FRAGMENTATION",
        `There are ${totalFree} free blocks, but no ${size}-block consecutive run.`,
      );
    }

    return failure(
      "INSUFFICIENT_SPACE",
      `Not enough free blocks. Required: ${size}; available: ${totalFree}.`,
    );
  }

  function allocateLinked(disk, size, random = Math.random) {
    const freeBlockIds = getFreeBlockIds(disk);
    if (freeBlockIds.length < size) {
      return failure(
        "INSUFFICIENT_SPACE",
        `Not enough free blocks. Required: ${size}; available: ${freeBlockIds.length}.`,
      );
    }

    const dataBlockIds = shuffle(freeBlockIds, random).slice(0, size);
    return {
      success: true,
      allocationType: ALLOCATION_TYPE.LINKED,
      startBlock: dataBlockIds[0],
      dataBlockIds,
    };
  }

  function allocateIndexed(disk, size, random = Math.random) {
    const freeBlockIds = getFreeBlockIds(disk);
    const requiredBlocks = size + 1;

    if (freeBlockIds.length < requiredBlocks) {
      return failure(
        "INSUFFICIENT_SPACE",
        `Indexed allocation needs ${requiredBlocks} blocks (${size} data + 1 index); available: ${freeBlockIds.length}.`,
      );
    }

    const shuffledIds = shuffle(freeBlockIds, random);
    return {
      success: true,
      allocationType: ALLOCATION_TYPE.INDEXED,
      indexBlockId: shuffledIds[0],
      dataBlockIds: shuffledIds.slice(1, requiredBlocks),
    };
  }

  function findAllocation(disk, size, allocationType, random = Math.random) {
    switch (allocationType) {
      case ALLOCATION_TYPE.CONTIGUOUS:
        return allocateContiguous(disk, size);
      case ALLOCATION_TYPE.LINKED:
        return allocateLinked(disk, size, random);
      case ALLOCATION_TYPE.INDEXED:
        return allocateIndexed(disk, size, random);
      default:
        return failure("UNKNOWN_ALLOCATION_TYPE", "Select a valid allocation method.");
    }
  }

  namespace.Allocators = Object.freeze({
    getFreeBlockIds,
    allocateContiguous,
    allocateLinked,
    allocateIndexed,
    findAllocation,
  });
})(window);
