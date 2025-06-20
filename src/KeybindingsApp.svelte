<script>
  import { onMount } from 'svelte';
  
  // Props
  export let keybindingsUrl = '/keybindings.toml';
  
  // State
  let keybindings = [];
  let searchTerm = '';
  let activeCategory = 'all';
  let loading = true;
  let error = null;
  
  // Constants
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'core', label: 'Core' },
    { id: 'movement', label: 'Movement' },
    { id: 'editing', label: 'Editing' },
    { id: 'buffer', label: 'Buffer' },
    { id: 'window', label: 'Window' },
    { id: 'file', label: 'File' },
    { id: 'search', label: 'Search' },
    { id: 'custom', label: 'Custom' }
  ];
  
  const levels = {
    white: { label: 'Beginner', bg: '#e2e8f0', color: '#0f172a' },
    yellow: { label: 'Intermediate', bg: '#fbbf24', color: '#451a03' },
    orange: { label: 'Advanced', bg: '#fb923c', color: '#431407' },
    green: { label: 'Expert', bg: '#34d399', color: '#022c22' },
    blue: { label: 'Master', bg: '#60a5fa', color: '#172554' },
    brown: { label: 'Brown Belt', bg: '#92400e', color: '#fef3c7' },
    black: { label: 'Black Belt', bg: '#0f172a', color: '#f8fafc' },
    red: { label: 'Grandmaster', bg: '#dc2626', color: '#fef2f2' }
  };
  
  const categoryColors = {
    all: '#94a3b8',
    core: '#ef4444',
    movement: '#3b82f6',
    editing: '#10b981',
    buffer: '#f59e0b',
    window: '#8b5cf6',
    file: '#ec4899',
    search: '#06b6d4',
    custom: '#6366f1'
  };
  
  // Simple TOML parser (for demo - in production use a proper parser)
  function parseSimpleToml(content) {
    const keybindings = [];
    const sections = content.split('[[keybindings]]').slice(1);
    
    sections.forEach(section => {
      const lines = section.trim().split('\n');
      const kb = {};
      
      lines.forEach(line => {
        const match = line.match(/^(\w+)\s*=\s*"(.*)"/);
        if (match) {
          kb[match[1]] = match[2];
        }
      });
      
      if (Object.keys(kb).length > 0) {
        keybindings.push(kb);
      }
    });
    
    return keybindings;
  }
  
  // Load keybindings
  onMount(async () => {
    try {
      const response = await fetch(keybindingsUrl);
      if (!response.ok) throw new Error('Failed to load keybindings');
      
      const content = await response.text();
      
      // Try to use the TOML library if available, otherwise use simple parser
      if (typeof toml !== 'undefined') {
        const data = toml.parse(content);
        keybindings = data.keybindings || [];
      } else {
        keybindings = parseSimpleToml(content);
      }
      
      loading = false;
    } catch (err) {
      error = err.message;
      loading = false;
      
      // Fallback to demo data
      keybindings = getDemoKeybindings();
    }
  });
  
  // Computed values
  $: filteredKeybindings = keybindings.filter(kb => {
    const matchesCategory = activeCategory === 'all' || kb.category === activeCategory;
    const matchesSearch = !searchTerm || 
      kb.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kb.function.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kb.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  $: stats = {
    totalBindings: filteredKeybindings.length,
    files: new Set(keybindings.map(kb => kb.source)).size,
    categories: categories.length - 1,
    levels: Object.keys(levels).length
  };
  
  // Helper functions
  function setCategory(category) {
    activeCategory = category;
  }
  
  function getCategoryLabel(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.label : categoryId;
  }
  
  function getDemoKeybindings() {
    return [
      { key: "C-a", function: "beginning-of-line", description: "Move cursor to beginning of current line", category: "movement", level: "white", source: "core-emacs" },
      { key: "C-e", function: "end-of-line", description: "Move cursor to end of current line", category: "movement", level: "white", source: "core-emacs" },
      { key: "C-f", function: "forward-char", description: "Move cursor forward one character", category: "movement", level: "white", source: "core-emacs" },
      { key: "C-b", function: "backward-char", description: "Move cursor backward one character", category: "movement", level: "white", source: "core-emacs" },
      { key: "C-x C-f", function: "find-file", description: "Open/find a file", category: "file", level: "white", source: "core-emacs" },
      { key: "C-x C-s", function: "save-buffer", description: "Save current buffer to file", category: "file", level: "white", source: "core-emacs" },
      { key: "C-x g", function: "magit-status", description: "🔥 Magit status - Git nirvana begins here", category: "custom", level: "blue", source: "bv-git.el" },
      { key: "C-.", function: "embark-act", description: "🔥 Contextual actions menu - act on thing at point", category: "custom", level: "blue", source: "bv-completion.el" },
      { key: "C-k", function: "kill-line", description: "Kill from cursor to end of line", category: "editing", level: "white", source: "core-emacs" },
      { key: "C-y", function: "yank", description: "Paste (yank) from kill ring", category: "editing", level: "white", source: "core-emacs" },
      { key: "C-x b", function: "switch-to-buffer", description: "Switch to another buffer", category: "buffer", level: "yellow", source: "core-emacs" },
      { key: "C-x 2", function: "split-window-below", description: "Split window horizontally (below)", category: "window", level: "orange", source: "core-emacs" },
      { key: "C-s", function: "isearch-forward", description: "Incremental search forward", category: "search", level: "white", source: "core-emacs" },
      { key: "C-g", function: "keyboard-quit", description: "Cancel current command/operation", category: "core", level: "white", source: "core-emacs" }
    ];
  }
</script>

<div class="app-container">
  <header class="header">
    <h1>Emacs Keybinding Reference</h1>
    <p class="subtitle">Essential commands for efficient text editing</p>
  </header>
  
  {#if loading}
    <div class="loading">Loading keybindings...</div>
  {:else if error}
    <div class="error">Error: {error}</div>
  {:else}
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">{stats.totalBindings}</div>
        <div class="stat-label">Keybindings</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{stats.files}</div>
        <div class="stat-label">Source Files</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{stats.categories}</div>
        <div class="stat-label">Categories</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{stats.levels}</div>
        <div class="stat-label">Skill Levels</div>
      </div>
    </div>
    
    <div class="filter-bar">
      {#each categories as category}
        <button 
          class="filter-btn {activeCategory === category.id ? 'active' : ''}"
          style={activeCategory === category.id ? `background: ${categoryColors[category.id]}; border-color: ${categoryColors[category.id]}; color: white;` : ''}
          on:click={() => setCategory(category.id)}
        >
          {category.label}
        </button>
      {/each}
      
      <input 
        type="text" 
        class="search-input" 
        placeholder="Search keybindings..." 
        bind:value={searchTerm}
      />
    </div>
    
    <div class="table-container">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Function</th>
              <th>Description</th>
              <th>Category</th>
              <th>Level</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {#if filteredKeybindings.length > 0}
              {#each filteredKeybindings as kb}
                <tr>
                  <td><span class="key">{kb.key}</span></td>
                  <td><code class="function-name">{kb.function}</code></td>
                  <td class="description">{kb.description}</td>
                  <td>
                    <span 
                      class="badge"
                      style="background: {categoryColors[kb.category]}; color: white;"
                    >
                      {getCategoryLabel(kb.category)}
                    </span>
                  </td>
                  <td>
                    <span 
                      class="badge"
                      style="background: {levels[kb.level]?.bg}; color: {levels[kb.level]?.color};"
                    >
                      {levels[kb.level]?.label || kb.level}
                    </span>
                  </td>
                  <td><span class="source">{kb.source}</span></td>
                </tr>
              {/each}
            {:else}
              <tr>
                <td colspan="6" class="no-results">
                  No keybindings match your search criteria
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .app-container {
    max-width: 1200px;
    margin: 0 auto;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 16px;
    padding: 48px;
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.1);
    border: 1px solid rgba(148, 163, 184, 0.05);
  }

  .header {
    text-align: center;
    margin-bottom: 48px;
  }

  h1 {
    font-size: 2.5rem;
    margin: 0;
    color: #f1f5f9;
    font-weight: 300;
    letter-spacing: -0.5px;
    font-family: 'SF Pro Display', -apple-system, sans-serif;
  }

  .subtitle {
    color: #64748b;
    margin-top: 8px;
    font-size: 1rem;
    font-family: 'SF Pro Text', -apple-system, sans-serif;
  }

  .loading, .error {
    text-align: center;
    padding: 100px;
    color: #94a3b8;
  }

  .error {
    color: #ef4444;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
    margin-bottom: 40px;
  }

  .stat-card {
    background: rgba(30, 41, 59, 0.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    border: 1px solid rgba(148, 163, 184, 0.1);
    transition: all 0.2s ease;
  }

  .stat-number {
    font-size: 2rem;
    font-weight: 300;
    color: #f1f5f9;
    margin-bottom: 4px;
    font-family: 'SF Pro Display', -apple-system, sans-serif;
  }

  .stat-label {
    color: #64748b;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: 'SF Pro Text', -apple-system, sans-serif;
  }

  .filter-bar {
    margin-bottom: 32px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .filter-btn {
    background: transparent;
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.2);
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'SF Pro Text', -apple-system, sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    opacity: 0.8;
  }

  .filter-btn:hover {
    opacity: 1;
    border-color: rgba(148, 163, 184, 0.4);
  }

  .filter-btn.active {
    opacity: 1;
  }

  .search-input {
    flex: 1;
    min-width: 300px;
    padding: 10px 16px;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 8px;
    font-family: 'SF Pro Text', -apple-system, sans-serif;
    font-size: 0.875rem;
    color: #f1f5f9;
    transition: all 0.2s ease;
    outline: none;
  }

  .search-input:focus {
    border-color: rgba(148, 163, 184, 0.4);
    background: rgba(30, 41, 59, 0.8);
  }

  .table-container {
    background: rgba(30, 41, 59, 0.3);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 12px;
    overflow: hidden;
  }

  .table-scroll {
    max-height: 600px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }

  th {
    padding: 16px;
    text-align: left;
    background: rgba(30, 41, 59, 0.8);
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    position: sticky;
    top: 0;
    z-index: 10;
    font-family: 'SF Pro Text', -apple-system, sans-serif;
  }

  td {
    padding: 16px;
    color: #cbd5e1;
    border-bottom: 1px solid rgba(148, 163, 184, 0.05);
    transition: all 0.15s ease;
    font-family: 'SF Pro Text', -apple-system, sans-serif;
  }

  tr:hover {
    background: rgba(30, 41, 59, 0.3);
  }

  .key {
    background: rgba(30, 41, 59, 0.8);
    color: #e2e8f0;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.8125rem;
    font-family: 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Code', monospace;
    display: inline-block;
    border: 1px solid rgba(148, 163, 184, 0.2);
    transition: all 0.15s ease;
  }

  tr:hover .key {
    background: rgba(30, 41, 59, 1);
  }

  .function-name {
    font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
    font-size: 0.8125rem;
    color: #e2e8f0;
  }

  .description {
    max-width: 400px;
    color: #94a3b8;
  }

  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0.3px;
    transition: all 0.15s ease;
    font-family: 'SF Pro Text', -apple-system, sans-serif;
  }

  .source {
    font-size: 0.75rem;
    color: #64748b;
    font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
  }

  .no-results {
    text-align: center;
    padding: 48px;
    color: #475569;
    font-size: 0.875rem;
  }

  .table-scroll::-webkit-scrollbar {
    width: 8px;
  }

  .table-scroll::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.5);
  }

  .table-scroll::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.2);
    border-radius: 4px;
  }

  .table-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.3);
  }
</style>