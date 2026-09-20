(function defineSimulation(global) {
  "use strict";

  const namespace = (global.FileAlloc = global.FileAlloc || {});
  const {
    TOTAL_BLOCKS,
    BLOCK_STATUS,
    BLOCK_ROLE,
    ALLOCATION_TYPE,
    FILE_COLORS,
  } = namespace.Constants;
  const { createDisk, createFileRecord } = namespace.Models;
  const { findAllocation } = namespace.Allocators;

  class Simulation {
    constructor({ totalBlocks = TOTAL_BLOCKS, random = Math.random } = {}) {
      this.totalBlocks = totalBlocks;
      this.random = random;
      this.listeners = new Set();
      this.reset({ silent: true });
    }

    getState() {
      const usedBlocks = this.disk.blocks.filter(
        (block) => block.status === BLOCK_STATUS.USED,
      ).length;

      return {
        disk: this.disk,
        files: this.files,
        selectedFileId: this.selectedFileId,
        usedBlocks,
        freeBlocks: this.disk.totalBlocks - usedBlocks,
      };
    }

    subscribe(listener) {
      this.listeners.add(listener);
      listener(this.getState());
      return () => this.listeners.delete(listener);
    }

    notify() {
      const state = this.getState();
      this.listeners.forEach((listener) => listener(state));
    }

    validateFileInput(name, size, allocationType) {
      const normalizedName = String(name ?? "").trim();
      const numericSize = Number(size);
      const validTypes = Object.values(ALLOCATION_TYPE);

      if (!normalizedName) {
        return { success: false, message: "Enter a file name." };
      }
      if (normalizedName.length > 30) {
        return { success: false, message: "File name must be 30 characters or fewer." };
      }
      if (this.files.some((file) => file.name.toLowerCase() === normalizedName.toLowerCase())) {
        return { success: false, message: `A file named “${normalizedName}” already exists.` };
      }
      if (!Number.isInteger(numericSize) || numericSize <= 0) {
        return { success: false, message: "File size must be a positive whole number." };
      }
      if (!validTypes.includes(allocationType)) {
        return { success: false, message: "Select a valid allocation method." };
      }

      return { success: true, name: normalizedName, size: numericSize };
    }

    createFile(name, size, allocationType) {
      const validation = this.validateFileInput(name, size, allocationType);
      if (!validation.success) {
        return validation;
      }

      const plan = findAllocation(this.disk, validation.size, allocationType, this.random);
      if (!plan.success) {
        return plan;
      }

      const fileId = `file-${this.nextFileId}`;
      const color = FILE_COLORS[(this.nextFileId - 1) % FILE_COLORS.length];
      this.commitAllocation(fileId, plan);

      const file = createFileRecord({
        id: fileId,
        name: validation.name,
        size: validation.size,
        allocationType,
        color,
        allocation: this.toAllocationDetail(plan),
      });

      this.files.push(file);
      this.nextFileId += 1;
      this.selectedFileId = fileId;
      this.notify();

      return { success: true, file, message: `Created “${file.name}” successfully.` };
    }

    commitAllocation(fileId, plan) {
      plan.dataBlockIds.forEach((blockId, index) => {
        const block = this.disk.blocks[blockId];
        block.status = BLOCK_STATUS.USED;
        block.fileId = fileId;
        block.role = BLOCK_ROLE.DATA;
        block.nextBlockId =
          plan.allocationType === ALLOCATION_TYPE.LINKED
            ? (plan.dataBlockIds[index + 1] ?? null)
            : null;
      });

      if (plan.allocationType === ALLOCATION_TYPE.INDEXED) {
        const indexBlock = this.disk.blocks[plan.indexBlockId];
        indexBlock.status = BLOCK_STATUS.USED;
        indexBlock.fileId = fileId;
        indexBlock.role = BLOCK_ROLE.INDEX;
        indexBlock.nextBlockId = null;
      }
    }

    toAllocationDetail(plan) {
      const dataBlockIds = [...plan.dataBlockIds];
      if (plan.allocationType === ALLOCATION_TYPE.CONTIGUOUS) {
        return { startBlock: plan.startBlock, length: plan.length, dataBlockIds };
      }
      if (plan.allocationType === ALLOCATION_TYPE.LINKED) {
        return { startBlock: plan.startBlock, dataBlockIds };
      }
      return { indexBlockId: plan.indexBlockId, dataBlockIds };
    }

    deleteFile(fileId) {
      const fileIndex = this.files.findIndex((file) => file.id === fileId);
      if (fileIndex === -1) {
        return { success: false, message: "File not found." };
      }

      const [file] = this.files.splice(fileIndex, 1);
      this.disk.blocks.forEach((block) => {
        if (block.fileId === fileId) {
          block.status = BLOCK_STATUS.FREE;
          block.fileId = null;
          block.role = null;
          block.nextBlockId = null;
        }
      });

      if (this.selectedFileId === fileId) {
        this.selectedFileId = null;
      }
      this.notify();
      return { success: true, file, message: `Deleted “${file.name}” and released its blocks.` };
    }

    selectFile(fileId) {
      const exists = this.files.some((file) => file.id === fileId);
      this.selectedFileId = exists && this.selectedFileId !== fileId ? fileId : null;
      this.notify();
    }

    reset({ silent = false } = {}) {
      this.disk = createDisk(this.totalBlocks);
      this.files = [];
      this.selectedFileId = null;
      this.nextFileId = 1;
      if (!silent) {
        this.notify();
      }
      return { success: true, message: "Simulation reset. All blocks are free." };
    }
  }

  namespace.Simulation = Simulation;
})(window);
