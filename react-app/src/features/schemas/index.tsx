import { createRoot } from 'react-dom/client';
import SchemasApp from './SchemasApp';
import type { CIGlobal } from '../../context/AppContext';

declare global {
  interface Window {
    CI?: CIGlobal;
    NADA_TRANSLATIONS_BASE64?: string;
  }
}

function mount() {
  const container = document.getElementById('root');
  if (!container) {
    console.error('React mount point #root not found');
    return;
  }

  // Read CI global from the page
  const ci: CIGlobal = window.CI || {
    site_url: '',
    base_url: '',
    user_info: {
      username: '',
      is_logged_in: false,
      is_admin: false,
      has_schema_permission: false,
    },
  };

  // Read translations from base64-encoded global
  let translations: Record<string, string> = {};
  try {
    const base64 = window.NADA_TRANSLATIONS_BASE64 || '';
    if (base64) {
      translations = JSON.parse(atob(base64));
    }
  } catch (e) {
    console.error('Failed to parse translations:', e);
  }

  const root = createRoot(container);
  root.render(<SchemasApp ci={ci} translations={translations} />);
}

mount();
