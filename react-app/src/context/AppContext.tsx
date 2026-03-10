import { createContext, useContext } from 'react';

export interface UserInfo {
  username: string;
  is_logged_in: boolean;
  is_admin: boolean;
  has_schema_permission: boolean;
}

export interface CIGlobal {
  site_url: string;
  base_url: string;
  user_info: UserInfo;
}

export const AppContext = createContext<CIGlobal>({
  site_url: '',
  base_url: '',
  user_info: {
    username: '',
    is_logged_in: false,
    is_admin: false,
    has_schema_permission: false,
  },
});

export function useAppContext(): CIGlobal {
  return useContext(AppContext);
}
