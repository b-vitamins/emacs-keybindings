// main.js - Entry point for the Svelte application
import './app.css';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app'),
  props: {
    keybindingsUrl: '/keybindings.toml'
  }
});

export default app;
