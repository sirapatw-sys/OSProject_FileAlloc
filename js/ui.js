(function defineUI(global) {
  "use strict";

  const namespace = (global.FileAlloc = global.FileAlloc || {});
  const { BLOCK_STATUS, BLOCK_ROLE, ALLOCATION_TYPE } = namespace.Constants;

  const allocationLabels = Object.freeze({
    [ALLOCATION_TYPE.CONTIGUOUS]: "Contiguous",
    [ALLOCATION_TYPE.LINKED]: "Linked",
    [ALLOCATION_TYPE.INDEXED]: "Indexed",
  });

  const methodHelpText = Object.freeze({
    [ALLOCATION_TYPE.CONTIGUOUS]: "Requires one consecutive run of free blocks.",
    [ALLOCATION_TYPE.LINKED]: "Uses any free data blocks and links them in order.",
    [ALLOCATION_TYPE.INDEXED]: "Uses the requested data blocks plus one index block.",
  });

  const randomNameParts = Object.freeze({
    bases: ["report", "notes", "photo", "slides", "data", "music", "video", "backup", "budget", "resume", "homework", "invoice"],
    extensions: [".txt", ".md", ".png", ".pptx", ".csv", ".mp3", ".mp4", ".zip", ".xlsx", ".pdf", ".docx", ".jpg"],
  });
  const RANDOM_MAX_SIZE = 8;

  function pickRandom(values) {
    return values[Math.floor(Math.random() * values.length)];
  }

  function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function plural(count, word) {
    return `${count} ${word}${count === 1 ? "" : "s"}`;
  }

  function percentOf(part, total) {
    return total === 0 ? 0 : Math.round((part / total) * 100);
  }

  function describeAllocation(file) {
    const allocation = file.allocation;
    const dataBlockIds = allocation.dataBlockIds;
    if (file.allocationType === ALLOCATION_TYPE.CONTIGUOUS) {
      return `Start block ${allocation.startBlock} · Length ${allocation.length}`;
    }
    if (file.allocationType === ALLOCATION_TYPE.LINKED) {
      return `Start block ${dataBlockIds[0]} · End block ${dataBlockIds[dataBlockIds.length - 1]}`;
    }
    return `Index block ${allocation.indexBlockId} points to ${plural(dataBlockIds.length, "data block")}`;
  }

  function largestFreeRun(blocks) {
    let largest = 0;
    let current = 0;
    blocks.forEach((block) => {
      current = block.status === BLOCK_STATUS.FREE ? current + 1 : 0;
      largest = Math.max(largest, current);
    });
    return largest;
  }

  function countBlocksByFile(blocks) {
    const counts = new Map();
    blocks.forEach((block) => {
      if (block.status === BLOCK_STATUS.USED) {
        counts.set(block.fileId, (counts.get(block.fileId) ?? 0) + 1);
      }
    });
    return counts;
  }

  // Re-rendering replaces elements, so keep keyboard focus on the same item.
  function replaceKeepingFocus(container, fragment, datasetKey) {
    const active = document.activeElement;
    const focusedKey =
      active && container.contains(active) ? active.dataset[datasetKey] : undefined;
    container.replaceChildren(fragment);
    if (focusedKey !== undefined) {
      const target = Array.from(container.children).find(
        (child) => child.dataset[datasetKey] === focusedKey,
      );
      if (target) target.focus();
    }
  }

  class UI {
    constructor(simulation) {
      this.simulation = simulation;
      this.state = null;
      this.form = document.querySelector("#create-file-form");
      this.nameInput = document.querySelector("#file-name");
      this.sizeInput = document.querySelector("#file-size");
      this.methodPicker = document.querySelector("#allocation-type");
      this.methodHelp = document.querySelector("#method-help");
      this.randomButton = document.querySelector("#random-file-button");
      this.createButton = document.querySelector("#create-file-button");
      this.resetButton = document.querySelector("#reset-button");
      this.statusMessage = document.querySelector("#status-message");
      this.diskGrid = document.querySelector("#disk-grid");
      this.fileList = document.querySelector("#file-list");
      this.fileCount = document.querySelector("#file-count");
      this.totalBlocks = document.querySelector("#total-blocks");
      this.usedBlocks = document.querySelector("#used-blocks");
      this.freeBlocks = document.querySelector("#free-blocks");
      this.usedPercent = document.querySelector("#used-percent");
      this.freePercent = document.querySelector("#free-percent");
      this.usageBar = document.querySelector("#usage-bar");
      this.bindEvents();
      this.simulation.subscribe((state) => this.render(state));
    }

    get selectedType() {
      return this.form.elements.allocationType.value;
    }

    bindEvents() {
      this.form.addEventListener("submit", (event) => {
        event.preventDefault();
        const result = this.simulation.createFile(
          this.nameInput.value,
          this.sizeInput.value,
          this.selectedType,
        );
        this.showStatus(result.message, result.success ? "success" : "error");
        if (result.success) {
          this.form.reset();
          this.updateMethodHelp();
          this.nameInput.focus();
        }
      });

      this.methodPicker.addEventListener("change", () => this.updateMethodHelp());
      this.sizeInput.addEventListener("input", () => this.updateMethodHelp());
      this.randomButton.addEventListener("click", () => this.fillRandomFile());

      this.resetButton.addEventListener("click", () => {
        const state = this.simulation.getState();
        if (state.files.length > 0 && !global.confirm("Reset the simulation and delete every file?")) {
          return;
        }
        const result = this.simulation.reset();
        this.showStatus(result.message, "success");
      });

      const selectBlockFile = (event) => {
        const block = event.target.closest(".disk-block[data-file-id]");
        if (block) this.simulation.selectFile(block.dataset.fileId);
      };
      this.diskGrid.addEventListener("click", selectBlockFile);
      this.diskGrid.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectBlockFile(event);
        }
      });
    }

    // Fills the form only; the user still presses Create so the demo stays visible.
    randomFileName() {
      const taken = new Set(this.state.files.map((file) => file.name.toLowerCase()));
      const base = pickRandom(randomNameParts.bases);
      const extension = pickRandom(randomNameParts.extensions);
      let name = `${base}${extension}`;
      for (let copy = 2; taken.has(name.toLowerCase()); copy += 1) {
        name = `${base}-${copy}${extension}`;
      }
      return name;
    }

    randomFileSize() {
      const type = this.selectedType;
      let fitLimit = this.state.freeBlocks;
      if (type === ALLOCATION_TYPE.CONTIGUOUS) {
        fitLimit = largestFreeRun(this.state.disk.blocks);
      } else if (type === ALLOCATION_TYPE.INDEXED) {
        fitLimit -= 1;
      }
      return randomInt(1, Math.max(1, Math.min(RANDOM_MAX_SIZE, fitLimit)));
    }

    fillRandomFile() {
      this.nameInput.value = this.randomFileName();
      this.sizeInput.value = String(this.randomFileSize());
      this.updateMethodHelp();
      this.createButton.focus();
    }

    updateMethodHelp() {
      const type = this.selectedType;
      const size = Number(this.sizeInput.value);
      this.methodHelp.classList.remove("is-warning", "is-ok");

      if (!this.state || !Number.isInteger(size) || size <= 0) {
        this.methodHelp.textContent = methodHelpText[type];
        return;
      }

      const isIndexed = type === ALLOCATION_TYPE.INDEXED;
      const needed = size + (isIndexed ? 1 : 0);
      const breakdown = isIndexed ? ` (${size} data + 1 index)` : "";
      const freeBlocks = this.state.freeBlocks;
      let note = `${plural(freeBlocks, "block")} free.`;
      let fits = needed <= freeBlocks;

      if (type === ALLOCATION_TYPE.CONTIGUOUS) {
        const gap = largestFreeRun(this.state.disk.blocks);
        fits = needed <= gap;
        note = `Largest free gap: ${plural(gap, "block")} in a row.`;
      }

      this.methodHelp.textContent = `Needs ${plural(needed, "block")}${breakdown}. ${note}`;
      this.methodHelp.classList.add(fits ? "is-ok" : "is-warning");
    }

    showStatus(message, type) {
      this.statusMessage.textContent = message;
      this.statusMessage.className = `status-message is-visible is-${type}`;
    }

    render(state) {
      this.state = state;
      const blockCounts = countBlocksByFile(state.disk.blocks);
      this.renderSummary(state, blockCounts);
      this.renderDisk(state);
      this.renderFiles(state, blockCounts);
      this.updateMethodHelp();
    }

    renderSummary(state, blockCounts) {
      const total = state.disk.totalBlocks;
      this.totalBlocks.textContent = total;
      this.usedBlocks.textContent = state.usedBlocks;
      this.freeBlocks.textContent = state.freeBlocks;
      this.usedPercent.textContent = `${percentOf(state.usedBlocks, total)}% of disk`;
      this.freePercent.textContent = `${percentOf(state.freeBlocks, total)}% of disk`;

      const fragment = document.createDocumentFragment();
      state.files.forEach((file) => {
        const count = blockCounts.get(file.id) ?? 0;
        const segment = createElement("span", "usage-segment");
        segment.style.setProperty("--file-color", file.color);
        segment.style.width = `${(count / total) * 100}%`;
        segment.title = `${file.name}: ${plural(count, "block")}`;
        if (state.selectedFileId && state.selectedFileId !== file.id) {
          segment.classList.add("is-dimmed");
        }
        fragment.append(segment);
      });
      this.usageBar.replaceChildren(fragment);
      this.usageBar.setAttribute(
        "aria-label",
        `Disk usage: ${state.usedBlocks} of ${total} blocks used`,
      );
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
        element.dataset.blockId = String(block.id);
        element.tabIndex = 0;

        if (block.status === BLOCK_STATUS.USED && file) {
          const isIndex = block.role === BLOCK_ROLE.INDEX;
          const isLinked = file.allocationType === ALLOCATION_TYPE.LINKED;
          element.classList.add("is-used");
          element.dataset.fileId = file.id;
          element.setAttribute("role", "button");
          element.style.setProperty("--file-color", file.color);

          if (isIndex) {
            element.classList.add("is-index");
            element.append(createElement("span", "block-tag", "IDX"));
          } else if (isLinked) {
            const tag = block.nextBlockId === null ? "end" : `→${block.nextBlockId}`;
            element.append(createElement("span", "block-tag block-tag-pointer", tag));
          }

          if (state.selectedFileId === block.fileId) {
            element.classList.add("is-selected");
            element.setAttribute("aria-pressed", "true");
          } else {
            element.setAttribute("aria-pressed", "false");
            if (state.selectedFileId) element.classList.add("is-dimmed");
          }

          const pointerText =
            block.nextBlockId === null ? "" : `; next block ${block.nextBlockId}`;
          element.setAttribute(
            "aria-label",
            `Block ${block.id}, ${block.role} block for ${file.name}${pointerText}`,
          );
          element.title = `Block ${block.id} · ${file.name} · ${block.role}${pointerText}`;
        } else {
          element.setAttribute("role", "img");
          element.setAttribute("aria-label", `Block ${block.id}, free`);
          element.title = `Block ${block.id} · free`;
          if (state.selectedFileId) element.classList.add("is-dimmed");
        }

        fragment.append(element);
      });

      replaceKeepingFocus(this.diskGrid, fragment, "blockId");
    }

    renderBlockChips(file) {
      const chips = createElement("div", "block-chips");
      const chip = (blockId, extraClass) =>
        createElement("span", `block-chip${extraClass ? ` ${extraClass}` : ""}`, String(blockId));
      const arrow = () => createElement("span", "chip-arrow", "→");
      const dataBlockIds = file.allocation.dataBlockIds;

      if (file.allocationType === ALLOCATION_TYPE.INDEXED) {
        chips.append(
          chip(file.allocation.indexBlockId, "is-index"),
          createElement("span", "chip-separator", "→"),
        );
        dataBlockIds.forEach((blockId) => chips.append(chip(blockId)));
      } else if (file.allocationType === ALLOCATION_TYPE.LINKED) {
        dataBlockIds.forEach((blockId) => chips.append(chip(blockId), arrow()));
        chips.append(createElement("span", "block-chip is-null", "null"));
      } else {
        dataBlockIds.forEach((blockId) => chips.append(chip(blockId)));
      }
      return chips;
    }

    renderFiles(state, blockCounts) {
      if (state.files.length === 0) {
        this.fileCount.textContent = "No files allocated.";
        this.fileList.replaceChildren(
          createElement("div", "empty-state", "Create a file to see its block allocation."),
        );
        return;
      }

      this.fileCount.textContent = `${plural(state.files.length, "file")} allocated. Click a file to highlight its blocks.`;
      const fragment = document.createDocumentFragment();

      state.files.forEach((file) => {
        const isSelected = state.selectedFileId === file.id;
        const card = createElement("article", "file-card");
        card.style.setProperty("--file-color", file.color);
        card.dataset.fileId = file.id;
        card.tabIndex = 0;
        card.setAttribute("aria-label", `${file.name}, ${isSelected ? "highlighted" : "not highlighted"}`);
        if (isSelected) card.classList.add("is-selected");

        const swatch = createElement("span", "file-swatch");
        const name = createElement("h3", "file-name", file.name);
        name.title = file.name;
        const indexNote = file.allocationType === ALLOCATION_TYPE.INDEXED ? " + 1 index block" : "";
        const meta = createElement(
          "p",
          "file-meta",
          `${plural(file.size, "data block")}${indexNote} · ${plural(blockCounts.get(file.id) ?? 0, "block")} on disk`,
        );
        const identity = createElement("div", "file-identity");
        identity.append(name, meta);

        const badge = createElement(
          "span",
          `method-badge method-${file.allocationType}`,
          allocationLabels[file.allocationType],
        );

        const deleteButton = createElement("button", "button button-delete", "Delete");
        deleteButton.type = "button";
        deleteButton.setAttribute("aria-label", `Delete ${file.name}`);
        deleteButton.addEventListener("click", (event) => {
          event.stopPropagation();
          const result = this.simulation.deleteFile(file.id);
          this.showStatus(result.message, result.success ? "success" : "error");
        });

        const header = createElement("div", "file-card-header");
        header.append(swatch, identity, badge, deleteButton);

        const detail = createElement("p", "allocation-detail", describeAllocation(file));

        card.addEventListener("click", () => this.simulation.selectFile(file.id));
        card.addEventListener("keydown", (event) => {
          if (event.target !== card) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            this.simulation.selectFile(file.id);
          }
        });
        card.append(header, detail, this.renderBlockChips(file));
        fragment.append(card);
      });

      replaceKeepingFocus(this.fileList, fragment, "fileId");
    }
  }

  namespace.UI = UI;
})(window);
