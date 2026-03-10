import axios from 'axios';
import { eventBus } from '../utils/eventBus';

// Port from index_vuetify.php lines 255-265 (401 handling)
const apiClient = axios.create({
  baseURL: window.CI?.base_url || '',
});

apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error.response?.status === 401) {
      // Trigger login dialog via event bus
      eventBus.emit('show-login-dialog');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
