# FileAlloc: File System Block Allocation Visualizer

**FileAlloc** is an interactive, browser-based educational visualizer developed for the **Operating Systems** course. It demonstrates how operating systems allocate, manage, and release storage disk blocks using three fundamental file allocation strategies: **Contiguous Allocation**, **Linked Allocation**, and **Indexed Allocation**.

---

## 🚀 Quick Start (วิธีเปิดใช้งาน)

This project has **zero external dependencies**, no backend, and requires **no build step or package installation**.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sirapatw-sys/OSProject_FileAlloc.git
   cd OSProject_FileAlloc
   ```
2. **Open the application:**
   - Double-click `index.html`, or
   - Right-click `index.html` and choose **Open with** your preferred browser (Google Chrome, Microsoft Edge, Firefox, Safari), or
   - Serve using VS Code Live Server.

> [!NOTE]
> All simulation data is stored **in-memory**. Refreshing or reopening the browser resets the simulation to a clean 64-block state.

---

## 📖 Project Documentation (สารบัญเอกสาร)

Comprehensive documentation for developers, testers, and presenters is organized in the [`docs/`](file:///c:/Users/ADMIN/Documents/GitHub/OSProject_FileAlloc/docs) directory:

| Document | Description | Target Audience |
| :--- | :--- | :--- |
| 📘 [**docs/requirements.md**](file:///c:/Users/ADMIN/Documents/GitHub/OSProject_FileAlloc/docs/requirements.md) | **System Requirements Specification (SRS)**: Data structures, allocation rules, validation criteria, and invariant definitions | Developers & Architects |
| 🧪 [**docs/test-cases.md**](file:///c:/Users/ADMIN/Documents/GitHub/OSProject_FileAlloc/docs/test-cases.md) | **Test Cases & Verification Suite**: 12 detailed manual test scenarios (TC01–TC12), edge cases, and bug report templates | Quality Assurance & Testers |
| 🎤 [**docs/demo-script.md**](file:///c:/Users/ADMIN/Documents/GitHub/OSProject_FileAlloc/docs/demo-script.md) | **Presentation & Demo Script**: 5–7 minute live presentation guide with cue sheet, Thai script, and anticipated Q&A | Presenters & Instructors |
| 📋 [**NEXT_STEPS_TH.md**](file:///c:/Users/ADMIN/Documents/GitHub/OSProject_FileAlloc/NEXT_STEPS_TH.md) | **Team Workflow Guide (ภาษาไทย)**: Roadmap, team role boundaries, and branch guidelines | Team Members |

---

## 🎯 Allocation Methods Comparison (เปรียบเทียบวิธีการจัดสรร)

In FileAlloc, **`size` always represents the number of data blocks requested**.

| Method | Disk Blocks Required | Allocation Rule | Advantages | Limitations / Trade-offs |
| :--- | :---: | :--- | :--- | :--- |
| **Contiguous** | `size` | All data blocks must occupy a single consecutive sequence. | • Fast sequential & direct access.<br>• Minimal metadata overhead. | • Suffers from **External Fragmentation**.<br>• Hard to grow file size dynamically. |
| **Linked** | `size` | Data blocks can be anywhere; each block points to the next (`→ nextBlockId`). The last block terminates with `null`. | • No external fragmentation.<br>• Any free block can be utilized. | • Slow direct/random access (must traverse chain).<br>• Pointer storage overhead. |
| **Indexed** | `size + 1` | Requires 1 dedicated **Index Block** + `size` **Data Blocks**. | • Supports fast direct access without consecutive blocks.<br>• No external fragmentation. | • Index block storage overhead (always requires +1 block, even for small files). |

---

## 🛡️ System Invariants & Guarantees (ความคงสภาพของระบบ)

To guarantee simulation correctness, FileAlloc strictly enforces the following core invariants:

1. **Space Conservation**:
   $$\text{Used Blocks} + \text{Free Blocks} = \text{Total Blocks} = 64$$
2. **Atomic Operations**:
   - If an allocation fails (e.g. duplicate name, invalid size, or insufficient space), the disk state remains completely unmodified (no partial writes).
3. **Free Block Cleanliness**:
   - Every block with status `free` must have `fileId === null`, `role === null`, and `nextBlockId === null`.
4. **Complete Reclamation**:
   - Deleting a file immediately frees all owned blocks (both Data Blocks and Index Blocks for indexed files).
5. **Chain Termination**:
   - Every linked file chain strictly ends with `null` to prevent cyclic loops.
6. **External Fragmentation Enforcement**:
   - Contiguous allocation is strictly rejected when no continuous run of free blocks exists, even if total free blocks $\ge$ requested size.

---

## 📂 Project Structure

```text
OSProject_FileAlloc/
├── index.html              # Main application UI and structure
├── css/
│   └── styles.css          # Visual styles, color palettes, and responsive layout
├── js/
│   ├── constants.js        # Global constants (Disk size: 64, block status, roles, palette)
│   ├── models.js           # Factory functions for Disk, Block, and File records
│   ├── allocators.js       # Core algorithms: Contiguous, Linked, and Indexed logic
│   ├── simulation.js       # Simulation state machine, validation, and event pub/sub
│   ├── ui.js               # DOM controller, event binding, and reactive rendering
│   └── app.js              # Application entry point and bootstrap
├── docs/
│   ├── requirements.md     # System Requirements Specification (SRS)
│   ├── test-cases.md       # Comprehensive 12-case test suite & verification matrix
│   └── demo-script.md      # 5–7 minute live classroom demonstration script
├── NEXT_STEPS_TH.md        # Internal team guidance and handoff instructions
└── README.md               # Main project documentation & quick start guide
```

---

## 👥 Ownership & Handoff Contract (การแบ่งงานภายในทีม)

```text
+-----------------------+-----------------------------+------------------------------------+
| Core System (Ohm)     | UI & Visualization (Art)   | Testing & Docs (Shogun)           |
+-----------------------+-----------------------------+------------------------------------+
| js/constants.js       | css/styles.css              | docs/requirements.md               |
| js/models.js          | js/ui.js                    | docs/test-cases.md                 |
| js/allocators.js      | index.html (layout only)    | docs/demo-script.md                |
| js/simulation.js      |                             | README.md                          |
| js/app.js             |                             |                                    |
+-----------------------+-----------------------------+------------------------------------+
```

### Core Public Simulation API
Other components interact with the simulation state through public methods on `window.FileAlloc.Simulation`:

```javascript
simulation.createFile(name, size, allocationType) // => { success, file, message } | { success: false, errorCode, message }
simulation.deleteFile(fileId)                     // => { success, file, message }
simulation.reset()                                // => { success, message }
simulation.selectFile(fileId)                     // => toggles highlight state
simulation.getState()                             // => { disk, files, selectedFileId, usedBlocks, freeBlocks }
simulation.subscribe(listener)                    // => registers reactive UI update callback
```

### Stable DOM Element IDs
The UI layer binds to these persistent DOM identifiers in `index.html`:

```text
create-file-form    file-name           file-size           allocation-type
method-help         reset-button        status-message      total-blocks
used-blocks         free-blocks         disk-grid           file-count
file-list
```

---

## 🌿 Git Branches

- `main` — Production-ready baseline
- `feature/ui-visualization` — UI enhancements and styling (Art)
- `docs/testing-and-demo` — Specifications, test suites, and demo guide (Shogun)
