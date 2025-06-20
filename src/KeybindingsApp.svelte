<script>
  import { onMount } from 'svelte';
  import { fade, fly, scale, blur } from 'svelte/transition';
  import { quintOut, backOut, elasticOut } from 'svelte/easing';
  
  // Props
  export let keybindingsUrl = '/keybindings.toml';
  
  // State
  let keybindings = [];
  let searchTerm = '';
  let activeCategory = 'all';
  let loading = true;
  let error = null;
  let hoveredRow = null;
  let selectedLevel = null;
  let viewMode = 'table'; // 'table', 'cards', 'compact'
  let animateStats = false;
  let darkMode = true; // Theme state
  
  // Animation counters
  let displayedStats = {
    totalBindings: 0,
    files: 0,
    categories: 0,
    levels: 0
  };
  
  // Constants
  const categories = [
    { id: 'all', label: 'All', icon: '•' },
    { id: 'core', label: 'Core', icon: '◆' },
    { id: 'movement', label: 'Movement', icon: '↗' },
    { id: 'editing', label: 'Editing', icon: '✎' },
    { id: 'buffer', label: 'Buffer', icon: '▢' },
    { id: 'window', label: 'Window', icon: '⧉' },
    { id: 'file', label: 'File', icon: '◫' },
    { id: 'search', label: 'Search', icon: '○' },
    { id: 'custom', label: 'Custom', icon: '✦' }
  ];
  
  const levels = {
    white: { label: 'Beginner', icon: '1', bg: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'var(--border)' },
    yellow: { label: 'Intermediate', icon: '2', bg: 'var(--accent-yellow)', color: 'var(--bg-primary)', border: 'transparent' },
    orange: { label: 'Advanced', icon: '3', bg: 'var(--accent-orange)', color: 'var(--bg-primary)', border: 'transparent' },
    green: { label: 'Expert', icon: '4', bg: 'var(--accent-green)', color: 'var(--bg-primary)', border: 'transparent' },
    blue: { label: 'Master', icon: '5', bg: 'var(--accent-blue)', color: 'var(--bg-primary)', border: 'transparent' },
    brown: { label: 'Veteran', icon: '6', bg: 'var(--text-muted)', color: 'var(--bg-primary)', border: 'transparent' },
    black: { label: 'Elite', icon: '7', bg: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'transparent' },
    red: { label: 'Grandmaster', icon: '★', bg: 'var(--accent-red)', color: 'var(--bg-primary)', border: 'transparent' }
  };
  
  const categoryColors = {
    all: 'var(--text-secondary)',
    core: 'var(--accent-red)',
    movement: 'var(--accent-blue)',
    editing: 'var(--accent-green)',
    buffer: 'var(--accent-yellow)',
    window: 'var(--accent-purple)',
    file: 'var(--accent-pink)',
    search: 'var(--accent-cyan)',
    custom: 'var(--accent-orange)'
  };
  
  // Animated background particles
  let particles = [];
  onMount(() => {
    // Create floating particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 10
      });
    }
    particles = particles;
  });
  
  // Simple TOML parser
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
      
      if (typeof toml !== 'undefined') {
        const data = toml.parse(content);
        keybindings = data.keybindings || [];
      } else {
        keybindings = parseSimpleToml(content);
      }
      
      loading = false;
      
      // Animate stats after loading
      setTimeout(() => {
        animateStats = true;
        animateNumbers();
      }, 500);
      
    } catch (err) {
      error = err.message;
      loading = false;
      keybindings = getDemoKeybindings();
      setTimeout(() => {
        animateStats = true;
        animateNumbers();
      }, 500);
    }
  });
  
  // Animate numbers
  function animateNumbers() {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      
      displayedStats.totalBindings = Math.floor(stats.totalBindings * easeProgress);
      displayedStats.files = Math.floor(stats.files * easeProgress);
      displayedStats.categories = Math.floor(stats.categories * easeProgress);
      displayedStats.levels = Math.floor(stats.levels * easeProgress);
      
      if (currentStep >= steps) {
        clearInterval(timer);
        displayedStats = { ...stats };
      }
    }, interval);
  }
  
  // Computed values
  $: filteredKeybindings = keybindings.filter(kb => {
    const matchesCategory = activeCategory === 'all' || kb.category === activeCategory;
    const matchesSearch = !searchTerm || 
      kb.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kb.function.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kb.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !selectedLevel || kb.level === selectedLevel;
    
    return matchesCategory && matchesSearch && matchesLevel;
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
    selectedLevel = null;
  }
  
  function getCategoryData(categoryId) {
    return categories.find(c => c.id === categoryId) || { label: categoryId, icon: '📌' };
  }
  
  function toggleLevel(level) {
    selectedLevel = selectedLevel === level ? null : level;
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

<div class="app-container" class:light-mode={!darkMode}>
  <!-- Theme Toggle -->
  <button 
    class="theme-toggle"
    on:click={() => darkMode = !darkMode}
    title="Toggle theme"
    aria-label="Toggle between dark and light mode"
  >
    <div class="toggle-track">
      <span class="toggle-icon moon">{darkMode ? '🌙' : '🌞'}</span>
      <span class="toggle-icon sun">{darkMode ? '🌞' : '🌙'}</span>
    </div>
    <div class="toggle-thumb" class:light={!darkMode}></div>
  </button>
  
  <!-- Animated background -->
  <div class="animated-bg">
    {#each particles as particle}
      <div 
        class="particle" 
        style="
          left: {particle.x}%;
          top: {particle.y}%;
          width: {particle.size}px;
          height: {particle.size}px;
          animation-duration: {particle.duration}s;
        "
      ></div>
    {/each}
  </div>
  
  <header class="header" in:fly={{ y: -50, duration: 800, easing: quintOut }}>
    <div class="header-glow"></div>
    <h1>
      <span class="header-icon">⌨️</span>
      Emacs Keybinding Reference
      <span class="header-version">v4.0</span>
    </h1>
    <p class="subtitle">Master the art of efficient text editing</p>
  </header>
  
  {#if loading}
    <div class="loading-container" in:fade>
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading keybindings...</p>
    </div>
  {:else if error}
    <div class="error-container" in:scale={{ start: 0.9, duration: 500 }}>
      <span class="error-icon">⚠️</span>
      <p>Error: {error}</p>
    </div>
  {:else}
    <!-- Stats Grid with Animation -->
    <div class="stats-grid" in:fly={{ y: 20, duration: 600, delay: 200, easing: quintOut }}>
      {#each [
        { value: displayedStats.totalBindings, label: 'Keybindings', icon: '◆', color: 'var(--accent-blue)' },
        { value: displayedStats.files, label: 'Source Files', icon: '◫', color: 'var(--accent-green)' },
        { value: displayedStats.categories, label: 'Categories', icon: '○', color: 'var(--accent-yellow)' },
        { value: displayedStats.levels, label: 'Skill Levels', icon: '★', color: 'var(--accent-red)' }
      ] as stat, i}
        <div 
          class="stat-card"
          in:scale={{ duration: 500, delay: 300 + i * 100, easing: backOut }}
          on:mouseenter={() => hoveredRow = `stat-${i}`}
          on:mouseleave={() => hoveredRow = null}
          class:hovered={hoveredRow === `stat-${i}`}
        >
          <div class="stat-icon" style="color: {stat.color}">{stat.icon}</div>
          <div class="stat-content">
            <div class="stat-number">{stat.value}</div>
            <div class="stat-label">{stat.label}</div>
          </div>
          <div class="stat-glow" style="background: {stat.color}"></div>
        </div>
      {/each}
    </div>
    
    <!-- Enhanced Filter Bar -->
    <div class="controls-container" in:fly={{ y: 20, duration: 600, delay: 400, easing: quintOut }}>
      <!-- View Mode Toggle -->
      <div class="view-toggle">
        <button 
          class="view-btn {viewMode === 'table' ? 'active' : ''}"
          on:click={() => viewMode = 'table'}
          title="Table View"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3zm8 16v-6H5v6h6zm0-8V5H5v6h6zm8 8v-6h-6v6h6zm0-8V5h-6v6h6z"/>
          </svg>
        </button>
        <button 
          class="view-btn {viewMode === 'cards' ? 'active' : ''}"
          on:click={() => viewMode = 'cards'}
          title="Card View"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z"/>
          </svg>
        </button>
        <button 
          class="view-btn {viewMode === 'compact' ? 'active' : ''}"
          on:click={() => viewMode = 'compact'}
          title="Compact View"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
          </svg>
        </button>
      </div>
      
      <!-- Category Filter -->
      <div class="filter-section">
        <div class="filter-pills">
          {#each categories as category, i}
            <button 
              class="filter-pill {activeCategory === category.id ? 'active' : ''}"
              style={activeCategory === category.id ? `background: ${categoryColors[category.id]}; color: var(--bg-primary); border-color: transparent;` : ''}
              on:click={() => setCategory(category.id)}
              in:scale={{ duration: 300, delay: i * 50, easing: backOut }}
            >
              <span class="pill-icon">{category.icon}</span>
              <span class="pill-label">{category.label}</span>
              {#if activeCategory === category.id}
                <span class="pill-count">{filteredKeybindings.length}</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Search Input -->
      <div class="search-container">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input 
          type="text" 
          class="search-input" 
          placeholder="Search keybindings, functions, or descriptions..." 
          bind:value={searchTerm}
        />
        {#if searchTerm}
          <button class="search-clear" on:click={() => searchTerm = ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        {/if}
      </div>
      
      <!-- Level Filter -->
      <div class="level-filter">
        {#each Object.entries(levels) as [level, data], i}
          <button
            class="level-btn {selectedLevel === level ? 'active' : ''}"
            style="background: {data.bg}; color: {data.color}; border-color: {data.border || 'transparent'};"
            on:click={() => toggleLevel(level)}
            in:scale={{ duration: 300, delay: 500 + i * 50, easing: backOut }}
            title={data.label}
          >
            <span class="level-icon">{data.icon}</span>
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Content Area -->
    {#if viewMode === 'table'}
      <!-- Enhanced Table View -->
      <div class="table-container" in:fade={{ duration: 500 }}>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th class="th-sticky">
                  <div class="th-content">
                    <span>Key</span>
                    <span class="th-icon">⌨️</span>
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <span>Function</span>
                    <span class="th-icon">⚡</span>
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <span>Description</span>
                    <span class="th-icon">📝</span>
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <span>Category</span>
                    <span class="th-icon">🏷️</span>
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <span>Level</span>
                    <span class="th-icon">📈</span>
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <span>Source</span>
                    <span class="th-icon">📁</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {#if filteredKeybindings.length > 0}
                {#each filteredKeybindings as kb, i}
                  <tr 
                    in:fly={{ x: -20, duration: 300, delay: Math.min(i * 30, 300), easing: quintOut }}
                    on:mouseenter={() => hoveredRow = i}
                    on:mouseleave={() => hoveredRow = null}
                    class:hovered={hoveredRow === i}
                  >
                    <td class="td-key">
                      <div class="key-wrapper">
                        <span class="key">{kb.key}</span>
                      </div>
                    </td>
                    <td>
                      <code class="function-name">{kb.function}</code>
                    </td>
                    <td class="description">
                      <span class="description-text">{kb.description}</span>
                    </td>
                    <td>
                      <span 
                        class="category-badge"
                        style="color: {categoryColors[kb.category]}; border-color: {categoryColors[kb.category]};"
                      >
                        <span class="badge-icon">{getCategoryData(kb.category).icon}</span>
                        <span>{getCategoryData(kb.category).label}</span>
                      </span>
                    </td>
                    <td>
                      <span 
                        class="level-badge"
                        style="background: {levels[kb.level]?.bg}; color: {levels[kb.level]?.color}; border: 1px solid {levels[kb.level]?.border};"
                      >
                        <span class="badge-icon">{levels[kb.level]?.icon}</span>
                        <span>{levels[kb.level]?.label || kb.level}</span>
                      </span>
                    </td>
                    <td>
                      <span class="source">{kb.source}</span>
                    </td>
                  </tr>
                {/each}
              {:else}
                <tr>
                  <td colspan="6" class="no-results">
                    <div class="no-results-content">
                      <span class="no-results-icon">🔍</span>
                      <p>No keybindings match your search criteria</p>
                      <button class="reset-btn" on:click={() => { searchTerm = ''; activeCategory = 'all'; selectedLevel = null; }}>
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {:else if viewMode === 'cards'}
      <!-- Card View -->
      <div class="cards-container" in:fade={{ duration: 500 }}>
        {#each filteredKeybindings as kb, i}
          <div 
            class="keybinding-card"
            in:scale={{ duration: 400, delay: Math.min(i * 50, 500), easing: backOut }}
            on:mouseenter={() => hoveredRow = i}
            on:mouseleave={() => hoveredRow = null}
          >
            <div class="card-header" style="background: {categoryColors[kb.category]}; color: var(--bg-primary);">
              <span class="card-key">{kb.key}</span>
              <span class="card-category">{getCategoryData(kb.category).icon}</span>
            </div>
            <div class="card-body">
              <code class="card-function">{kb.function}</code>
              <p class="card-description">{kb.description}</p>
              <div class="card-meta">
                <span class="card-level" style="background: {levels[kb.level]?.bg}; color: {levels[kb.level]?.color};">
                  {levels[kb.level]?.icon} {levels[kb.level]?.label}
                </span>
                <span class="card-source">{kb.source}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else if viewMode === 'compact'}
      <!-- Compact View -->
      <div class="compact-container" in:fade={{ duration: 500 }}>
        {#each filteredKeybindings as kb, i}
          <div 
            class="compact-row"
            in:fly={{ x: -10, duration: 300, delay: Math.min(i * 20, 300), easing: quintOut }}
          >
            <span class="compact-key">{kb.key}</span>
            <span class="compact-arrow">→</span>
            <code class="compact-function">{kb.function}</code>
            <span class="compact-category" style="color: {categoryColors[kb.category]};">
              {getCategoryData(kb.category).icon}
            </span>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* CSS Variables for Theming */
  .app-container {
    /* Dark Mode - Charcoal */
    --bg-primary: rgba(38, 38, 38, 0.95);
    --bg-secondary: rgba(48, 48, 48, 0.9);
    --bg-card: rgba(58, 58, 58, 0.6);
    --bg-hover: rgba(68, 68, 68, 0.5);
    --text-primary: #fafafa;
    --text-secondary: #b8b8b8;
    --text-muted: #888888;
    --border: rgba(255, 255, 255, 0.06);
    --border-hover: rgba(255, 255, 255, 0.1);
    --shadow-color: rgba(0, 0, 0, 0.5);
    --code-color: #a8b9ff;
    --header-glow: rgba(255, 255, 255, 0.05);
    --particle-color: rgba(255, 255, 255, 0.03);
    
    /* Accent colors - Muted palette */
    --accent-red: #d07070;
    --accent-blue: #7090d0;
    --accent-green: #70b070;
    --accent-yellow: #d0b070;
    --accent-purple: #9070d0;
    --accent-cyan: #70c0d0;
    --accent-orange: #d09070;
    --accent-pink: #d070a0;
    
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Light Mode Variables - Off-white/Cream */
  .app-container.light-mode {
    --bg-primary: rgba(252, 250, 247, 0.95);
    --bg-secondary: rgba(250, 248, 244, 0.9);
    --bg-card: rgba(255, 255, 255, 0.7);
    --bg-hover: rgba(245, 243, 239, 0.8);
    --text-primary: #2c2c2c;
    --text-secondary: #5a5a5a;
    --text-muted: #8a8a8a;
    --border: rgba(0, 0, 0, 0.06);
    --border-hover: rgba(0, 0, 0, 0.1);
    --shadow-color: rgba(0, 0, 0, 0.08);
    --code-color: #4a5998;
    --header-glow: rgba(0, 0, 0, 0.02);
    --particle-color: rgba(0, 0, 0, 0.02);
    
    /* Accent colors - Refined palette */
    --accent-red: #c85450;
    --accent-blue: #4a7ac7;
    --accent-green: #50a14f;
    --accent-yellow: #c18401;
    --accent-purple: #7b5aa6;
    --accent-cyan: #0997b3;
    --accent-orange: #d75f00;
    --accent-pink: #b85a7b;
  }

  /* Theme Toggle Button */
  .theme-toggle {
    position: fixed;
    top: 24px;
    right: 24px;
    width: 52px;
    height: 28px;
    background: transparent;
    border: none;
    cursor: pointer;
    z-index: 100;
    padding: 0;
  }

  .toggle-track {
    position: absolute;
    width: 100%;
    height: 100%;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .toggle-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    transition: opacity 0.3s ease;
  }

  .toggle-icon.moon {
    left: 6px;
    opacity: 1;
  }

  .toggle-icon.sun {
    right: 6px;
    opacity: 0;
  }

  .light-mode .toggle-icon.moon {
    opacity: 0;
  }

  .light-mode .toggle-icon.sun {
    opacity: 1;
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    background: var(--text-primary);
    border-radius: 11px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .toggle-thumb.light {
    transform: translateX(24px);
  }

  .app-container {
    position: relative;
    max-width: 1400px;
    margin: 0 auto;
    background: var(--bg-primary);
    backdrop-filter: blur(12px) saturate(120%);
    -webkit-backdrop-filter: blur(12px) saturate(120%);
    border-radius: 20px;
    padding: 48px;
    box-shadow: 
      0 0 0 1px var(--border),
      0 10px 40px -10px var(--shadow-color),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.02);
    overflow: hidden;
  }

  /* Page background */
  :global(body) {
    background: #1a1a1a;
    transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  :global(body:has(.light-mode)) {
    background: #f7f5f2;
  }

  /* Animated Background */
  .animated-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    z-index: 0;
    opacity: 0.3;
  }

  .particle {
    position: absolute;
    background: radial-gradient(circle, var(--particle-color) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    animation: float 20s infinite ease-in-out;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0) translateX(0);
    }
    33% {
      transform: translateY(-30px) translateX(30px);
    }
    66% {
      transform: translateY(30px) translateX(-30px);
    }
  }

  /* Header */
  .header {
    position: relative;
    text-align: center;
    margin-bottom: 48px;
    z-index: 1;
  }

  .header-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    height: 100px;
    background: radial-gradient(ellipse at center, var(--header-glow) 0%, transparent 70%);
    filter: blur(60px);
    z-index: -1;
  }

  h1 {
    font-size: 2.5rem;
    margin: 0;
    color: var(--text-primary);
    font-weight: 300;
    letter-spacing: -0.02em;
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .header-icon {
    font-size: 2rem;
    opacity: 0.8;
  }

  .header-version {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
    padding: 4px 12px;
    border: 1px solid var(--border);
    border-radius: 16px;
    font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
    letter-spacing: 0.02em;
  }

  .subtitle {
    color: var(--text-secondary);
    margin-top: 8px;
    font-size: 1rem;
    font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 400;
    letter-spacing: 0.01em;
  }

  /* Loading State */
  .loading-container {
    text-align: center;
    padding: 100px;
    position: relative;
    z-index: 1;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    margin: 0 auto 24px;
    border: 2px solid var(--border);
    border-top-color: var(--text-secondary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    color: var(--text-secondary);
    font-size: 1.125rem;
  }

  /* Error State */
  .error-container {
    text-align: center;
    padding: 60px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 16px;
    color: #ef4444;
    position: relative;
    z-index: 1;
  }

  .error-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 16px;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
    position: relative;
    z-index: 1;
  }

  .stat-card {
    position: relative;
    background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-hover) 100%);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 32px;
    border-radius: 20px;
    text-align: center;
    border: 1px solid var(--border);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    cursor: pointer;
  }

  .stat-card:hover, .stat-card.hovered {
    transform: translateY(-5px) scale(1.02);
    border-color: var(--border-hover);
    box-shadow: 0 20px 40px -10px var(--shadow-color);
  }

  .stat-glow {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    opacity: 0;
    filter: blur(60px);
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .stat-card:hover .stat-glow {
    opacity: 0.2;
  }

  .stat-icon {
    font-size: 2.5rem;
    margin-bottom: 16px;
    display: block;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  }

  .stat-content {
    position: relative;
    z-index: 1;
  }

  .stat-number {
    font-size: 2.25rem;
    font-weight: 300;
    color: var(--text-primary);
    margin-bottom: 8px;
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .stat-label {
    color: var(--text-secondary);
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 500;
  }

  /* Controls Container */
  .controls-container {
    background: var(--bg-card);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 32px;
    display: grid;
    gap: 24px;
    position: relative;
    z-index: 1;
  }

  /* View Toggle */
  .view-toggle {
    display: flex;
    gap: 8px;
    padding: 4px;
    background: var(--bg-primary);
    border-radius: 12px;
    width: fit-content;
  }

  .view-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .view-btn:hover {
    background: var(--bg-hover);
    color: var(--text-secondary);
  }

  .view-btn.active {
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
    color: white;
  }

  .light-mode .view-btn.active {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  }

  /* Filter Pills */
  .filter-section {
    position: relative;
  }

  .filter-pills {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .filter-pill {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border);
    padding: 8px 18px;
    border-radius: 20px;
    cursor: pointer;
    font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    letter-spacing: 0.01em;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    overflow: hidden;
  }

  .filter-pill:hover {
    background: var(--bg-hover);
    border-color: var(--border-hover);
  }

  .filter-pill.active {
    background: var(--text-primary);
    color: var(--bg-primary);
    border-color: transparent;
    font-weight: 500;
  }

  .pill-icon {
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .pill-count {
    background: var(--bg-hover);
    color: var(--text-primary);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.75rem;
    margin-left: 4px;
    font-variant-numeric: tabular-nums;
  }

  .filter-pill.active .pill-count {
    background: rgba(255, 255, 255, 0.2);
    color: var(--bg-primary);
  }

  /* Search Container */
  .search-container {
    position: relative;
    max-width: 500px;
  }

  .search-icon {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 12px 48px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 12px;
    font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 0.875rem;
    color: var(--text-primary);
    transition: all 0.2s ease;
    outline: none;
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .search-input:focus {
    border-color: var(--text-secondary);
    background: var(--bg-hover);
  }

  .search-clear {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .search-clear:hover {
    background: var(--bg-hover);
    color: var(--text-secondary);
  }

  /* Level Filter */
  .level-filter {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .level-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
    transition: all 0.2s ease;
    position: relative;
  }

  .level-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px -4px var(--shadow-color);
  }

  .level-btn.active {
    border-width: 2px;
  }

  /* Table Container */
  .table-container {
    background: var(--bg-card);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
    position: relative;
    z-index: 1;
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
    padding: 20px;
    text-align: left;
    background: var(--bg-primary);
    backdrop-filter: blur(10px);
    color: var(--text-secondary);
    font-weight: 500;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 10;
    font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .th-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .th-icon {
    opacity: 0.6;
    font-size: 1rem;
  }

  td {
    padding: 20px;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border);
    transition: all 0.2s ease;
    font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  tr {
    position: relative;
    transition: all 0.2s ease;
  }

  tr:hover, tr.hovered {
    background: var(--bg-hover);
  }

  /* Key Cell */
  .td-key {
    font-weight: 500;
  }

  .key-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .key {
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 5px 12px;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.8125rem;
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
    display: inline-block;
    border: 1px solid var(--border);
    transition: all 0.15s ease;
    letter-spacing: 0.02em;
  }

  tr:hover .key {
    background: var(--bg-hover);
    border-color: var(--border-hover);
  }

  .function-name {
    font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
    font-size: 0.875rem;
    color: var(--code-color);
    font-weight: 500;
  }

  .description-text {
    line-height: 1.5;
  }

  /* Badges */
  .category-badge, .level-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 400;
    letter-spacing: 0.02em;
    transition: all 0.15s ease;
    font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .category-badge {
    background: transparent;
    border: 1px solid currentColor;
    opacity: 0.8;
  }

  .level-badge {
    font-weight: 500;
  }

  .badge-icon {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .source {
    font-size: 0.8125rem;
    color: var(--text-muted);
    font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
  }

  /* No Results */
  .no-results {
    text-align: center;
    padding: 80px;
  }

  .no-results-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .no-results-icon {
    font-size: 4rem;
    opacity: 0.3;
  }

  .reset-btn {
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 16px;
  }

  .reset-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px -4px rgba(59, 130, 246, 0.4);
  }

  /* Card View */
  .cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
    position: relative;
    z-index: 1;
  }

  .keybinding-card {
    background: rgba(30, 41, 59, 0.4);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }

  .keybinding-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);
    border-color: rgba(148, 163, 184, 0.3);
  }

  .card-header {
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
  }

  .card-key {
    font-family: 'SF Mono', monospace;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .card-category {
    font-size: 1.5rem;
  }

  .card-body {
    padding: 20px;
  }

  .card-function {
    color: #60a5fa;
    font-size: 1rem;
    font-weight: 500;
    display: block;
    margin-bottom: 12px;
  }

  .card-description {
    color: #94a3b8;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-level {
    padding: 4px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .card-source {
    color: #64748b;
    font-size: 0.75rem;
    font-family: 'SF Mono', monospace;
  }

  /* Compact View */
  .compact-container {
    background: rgba(30, 41, 59, 0.3);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 16px;
    padding: 24px;
    position: relative;
    z-index: 1;
  }

  .compact-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    transition: all 0.2s ease;
    font-family: 'SF Mono', monospace;
    font-size: 0.875rem;
  }

  .compact-row:hover {
    background: rgba(30, 41, 59, 0.5);
  }

  .compact-key {
    color: #e2e8f0;
    font-weight: 600;
    min-width: 80px;
  }

  .compact-arrow {
    color: #475569;
  }

  .compact-function {
    color: #60a5fa;
    flex: 1;
  }

  .compact-category {
    font-size: 1rem;
  }

  /* Scrollbar */
  .table-scroll::-webkit-scrollbar,
  .compact-container::-webkit-scrollbar {
    width: 10px;
  }

  .table-scroll::-webkit-scrollbar-track,
  .compact-container::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.3);
  }

  .table-scroll::-webkit-scrollbar-thumb,
  .compact-container::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 5px;
  }

  .table-scroll::-webkit-scrollbar-thumb:hover,
  .compact-container::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.5);
  }

  /* Media Queries */
  @media (max-width: 768px) {
    .app-container {
      padding: 24px;
      border-radius: 16px;
    }

    h1 {
      font-size: 2rem;
      flex-direction: column;
      gap: 8px;
    }

    .header-icon {
      font-size: 2rem;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .filter-pills {
      justify-content: center;
    }

    .cards-container {
      grid-template-columns: 1fr;
    }

    table {
      font-size: 0.875rem;
    }

    th, td {
      padding: 12px;
    }
  }
</style>
