import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { socketService } from './services/socketService.js';

// Initialize socket connection
socketService.connect();

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
