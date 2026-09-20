# FileAlloc: File System Block Allocation Visualizer

FileAlloc is a browser-based Operating Systems mini project that visualizes how files occupy disk blocks using contiguous, linked, and indexed allocation.

## Run the project

Open `index.html` in a modern browser. The project has no backend, package installation, or build step.

## Current baseline

- Fixed 64-block simulated disk
- Create files with contiguous, linked, or indexed allocation
- Delete files and release every owned block
- Reset the complete simulation
- Used, free, and total block counters
- Allocation details for every file
- Block highlighting and a functional baseline layout
- Atomic allocation: a failed request does not partially modify the disk

Simulation data is intentionally in memory. Refreshing the page starts a new simulation.

## Allocation rules

| Method | Disk blocks required | Rule |
| --- | ---: | --- |
| Contiguous | `size` | All data blocks must form one consecutive run. |
| Linked | `size` | Data blocks can be anywhere; each block points to the next. |
| Indexed | `size + 1` | Uses one index block in addition to the requested data blocks. |

`size` always means the number of data blocks. The indexed method's index block is counted as used disk space.

## Project structure

```text
FileAlloc/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── constants.js
│   ├── models.js
│   ├── allocators.js
│   ├── simulation.js
│   ├── ui.js
│   └── app.js
└── README.md
```

## Ownership and handoff contract

### Core system — Ohm

- `js/constants.js`
- `js/models.js`
- `js/allocators.js`
- `js/simulation.js`
- `js/app.js`

Core public methods:

```text
simulation.createFile(name, size, allocationType)
simulation.deleteFile(fileId)
simulation.reset()
simulation.selectFile(fileId)
simulation.getState()
simulation.subscribe(listener)
```

Every mutating method returns an object containing `success` and `message`. `createFile` and `deleteFile` also return the affected file when successful.

### UI and visualization — Art

- `css/styles.css`
- `js/ui.js`
- Layout-only changes in `index.html`

Keep the existing DOM element IDs unless `js/ui.js` is updated in the same change. UI code should use the public simulation methods instead of changing `simulation.disk` or `simulation.files` directly.

### Tests and documentation — Shogun

- Test cases
- Requirement documentation
- Demo script
- README improvements

Important invariants to test:

- `usedBlocks + freeBlocks === totalBlocks`
- A free block has no file, role, or next-block pointer
- A failed allocation leaves the disk unchanged
- Deleting an indexed file releases both its data blocks and index block
- The linked chain ends with `null`
- Contiguous allocation rejects external fragmentation even when total free space is sufficient

## Stable DOM IDs

The UI currently depends on these IDs:

```text
create-file-form
file-name
file-size
allocation-type
method-help
reset-button
status-message
total-blocks
used-blocks
free-blocks
disk-grid
file-count
file-list
```

## Suggested Git branches

```text
feature/ui-visualization
docs/testing-and-demo
```

Avoid changing allocation rules during UI or documentation work. Discuss changes to the data model or public simulation methods before implementation so the branches remain compatible.
