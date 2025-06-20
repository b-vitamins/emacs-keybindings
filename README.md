# Emacs Keybindings Reference

A searchable, filter-friendly reference for Emacs keybindings, backed by a human-readable **TOML** file.

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/b-vitamins/emacs-keybindings.git
cd emacs-keybindings

# Install dependencies
npm install       # Svelte, Vite, @ltd/j-toml, etc.

# Launch the development server
npm run dev       # → http://localhost:5173
```

> **Tip:**
>
> * `npm run build` creates a production bundle in `dist/`
> * `npm run preview` serves that bundle locally.

## Usage

### Editing Keybindings

1. Open `public/keybindings.toml`
2. Add, remove, or modify keybinding entries
3. Each entry follows this format:

```toml
[[keybindings]]
key = "C-x C-f"
function = "find-file"
description = "Open/find a file"
category = "file"
level = "white"
source = "core-emacs"
```

### Categories

* `core` - Core Emacs commands
* `movement` - Cursor movement
* `editing` - Text editing
* `buffer` - Buffer operations
* `window` - Window management
* `file` - File operations
* `search` - Search commands
* `custom` - Custom/user-defined bindings

### Skill Levels

* `white` - Beginner
* `yellow` - Intermediate
* `orange` - Advanced
* `green` - Expert
* `blue` - Master
* `brown` - Brown Belt
* `black` - Black Belt
* `red` - Grand-master

## License

MIT
