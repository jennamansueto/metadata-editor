declare global {
  interface Window {
    CI: {
      site_url: string;
      base_url: string;
      base_asset_url: string;
      user_info: {
        username: string;
        is_logged_in: boolean;
        is_admin: boolean;
      };
    };
    sid: string | number;
    form_template: {
      uid: string;
      template: { items: unknown[] };
      [key: string]: unknown;
    };
    form_template_parts: Record<string, unknown>;
    project_metadata: Record<string, unknown>;
    project_sid: number | null;
    project_idno: string;
    project_type: string;
    user_has_edit_access: boolean;
    translation_messages: {
      default: Record<string, string>;
    };
  }
}

export {};
