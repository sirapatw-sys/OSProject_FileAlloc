(function defineUI(global) {
  "use strict";

  const namespace = (global.FileAlloc = global.FileAlloc || {});
  const { BLOCK_STATUS, BLOCK_ROLE, ALLOCATION_TYPE } = namespace.Constants;

  const allocationLabels = Object.freeze({
    [ALLOCATION_TYPE.CONTIGUOUS]: "Contiguous",
    [ALLOCATION_TYPE.LINKED]: "Linked",
    [ALLOCATION_TYPE.INDEXED]: "Indexed",
  });

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function describeAllocation(file) {
    const allocation = file.allocation;
    if (file.allocationType === ALLOCATION_TYPE.CONTIGUOUS) {
      return `Start: ${allocation.startBlock} · Length: ${allocation.length} · Blocks: ${allocation.dataBlockIds.join(", ")}`;
    }
    if (file.allocationType === ALLOCATION_TYPE.LINKED) {
      return `Chain: ${allocation.dataBlockIds.join(" → ")} → null`;
    }
    return `Index: ${allocation.indexBlockId} · Data: ${allocation.dataBlockIds.join(", ")}`;
  }

  class UI {
    constructor(simulation) {
      this.simulation = simulation;
      this.form = document.querySelector("#create-file-form");
      this.nameInput = document.querySelector("#file-name");
      this.sizeInput = document.querySelector("#file-size");
      this.typeSelect = document.querySelector("#allocation-type");
      this.methodHelp = document.querySelector("#method-help");
      this.resetButton = document.querySelector("#reset-button");
      this.statusMessage = document.querySelector("#status-message");
      this.diskGrid = document.querySelector("#disk-grid");
      this.fileList = document.querySelector("#file-list");
      this.fileCount = document.querySelector("#file-count");
      this.totalBlocks = document.querySelector("#total-blocks");
      this.usedBlocks = document.querySelector("#used-blocks");
      this.freeBlocks = document.querySelector("#free-blocks");
      this.bindEvents();
      this.simulation.subscribe((state) => this.render(state));
    }

    bindEvents() {
      this.form.addEventListener("submit", (event) => {
        event.preventDefault();
        const result = this.simulation.createFile(
          this.nameInput.value,
          this.sizeInput.value,
          this.typeSelect.value,
        );
        this.showStatus(result.message, result.success ? "success" : "error");
        if (result.success) {
          this.form.reset();
          this.updateMethodHelp();
          this.nameInput.focus();
        }
      });

      this.typeSelect.addEventListener("change", () => this.updateMethodHelp());

      this.resetButton.addEventListener("click", () => {
        const state = this.simulation.getState();
        if (state.files.length > 0 && !global.confirm("Reset the simulation and delete every file?")) {
          return;
        }
        const result = this.simulation.reset();
        this.showStatus(result.message, "success");
      });
    }

    updateMethodHelp() {
      const helpText = {
        [ALLOCATION_TYPE.CONTIGUOUS]: "Requires one consecutive run of free blocks.",
        [ALLOCATION_TYPE.LINKED]: "Uses any free data blocks and links them in order.",
        [ALLOCATION_TYPE.INDEXED]: "Uses the requested data blocks plus one index block.",
      };
      this.methodHelp.textContent = helpText[this.typeSelect.value];
    }

    showStatus(message, type) {
      this.statusMessage.textContent = message;
      this.statusMessage.className = `status-message is-visible is-${type}`;
    }

    render(state) {
      this.renderSummary(state);
      this.renderDisk(state);
      this.renderFiles(state);
    }

    renderSummary(state) {
      this.totalBlocks.textContent = state.disk.totalBlocks;
      this.usedBlocks.textContent = state.usedBlocks;
      this.freeBlocks.textContent = state.freeBlocks;
    }

    renderDisk(state) {
      const fileById = new Map(state.files.map((file) => [file.id, file]));
      const fragment = document.createDocumentFragment();

      state.disk.blocks.forEach((block) => {
        const file = fileById.get(block.fileId);
        const element = createElement("div", "disk-block");
        const id = createElement("span", "block-id", String(block.id));
        const label = createElement("span", "block-label", file ? file.name : "Free");

        element.append(id, label);
        element.tabIndex = 0;
        element.setAttribute("role", "img");

        if (block.status === BLOCK_STATUS.USED && file) {
          element.classList.add("is-used");
          element.style.setProperty("--file-color", file.color);
          if (block.role === BLOCK_ROLE.INDEX) {
            element.classList.add("is-index");
          }
          if (state.selectedFileId === block.fileId) {
            element.classList.add("is-selected");
          } else if (state.selectedFileId) {
            element.classList.add("is-dimmed");
          }

          const pointerText =
            block.nextBlockId === null ? "" : `; next block ${block.nextBlockId}`;
          element.setAttribute(
            "aria-label",
            `Block ${block.id}, ${block.role} block for ${file.name}${pointerText}`,
          );
          element.title = `${file.name} · ${block.role}${pointerText}`;
        } else {
          element.setAttribute("aria-label", `Block ${block.id}, free`);
          if (state.selectedFileId) element.classList.add("is-dimmed");
        }

        fragment.append(element);
      });

      this.diskGrid.replaceChildren(fragment);
    }

    renderFiles(state) {
      if (state.files.length === 0) {
        this.fileCount.textContent = "No files allocated.";
        this.fileList.replaceChildren(
          createElement("div", "empty-state", "Create a file to see its block allocation."),
        );
        return;
      }

      this.fileCount.textContent = `${state.files.length} file${state.files.length === 1 ? "" : "s"} allocated.`;
      const fragment = document.createDocumentFragment();

      state.files.forEach((file) => {
        const card = createElement("article", "file-card");
        card.style.setProperty("--file-color", file.color);
        card.tabIndex = 0;
        if (state.selectedFileId === file.id) card.classList.add("is-selected");

        const identity = createElement("div");
        identity.append(
          createElement("h3", "file-name", file.name),
          createElement(
            "p",
            "file-meta",
            `${allocationLabels[file.allocationType]} · ${file.size} data block${file.size === 1 ? "" : "s"}`,
          ),
        );

        const allocation = createElement("p", "allocation-detail", describeAllocation(file));
        const deleteButton = createElement("button", "button button-delete", "Delete");
        deleteButton.type = "button";
        deleteButton.setAttribute("aria-label", `Delete ${file.name}`);
        deleteButton.addEventListener("click", (event) => {
          event.stopPropagation();
          const result = this.simulation.deleteFile(file.id);
          this.showStatus(result.message, result.success ? "success" : "error");
        });

        card.addEventListener("click", () => this.simulation.selectFile(file.id));
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            this.simulation.selectFile(file.id);
          }
        });
        card.append(identity, allocation, deleteButton);
        fragment.append(card);
      });

      this.fileList.replaceChildren(fragment);
    }
  }

  namespace.UI = UI;
})(window);
