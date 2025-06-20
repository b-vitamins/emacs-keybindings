<script>
  import KeybindingsApp from './KeybindingsApp.svelte';
  
  export let keybindingsUrl = '/keybindings.toml';
</script>

<main>
  <KeybindingsApp {keybindingsUrl} />
</main>

<style>
  main {
    width: 100%;
    min-height: 100vh;
  }
</style>