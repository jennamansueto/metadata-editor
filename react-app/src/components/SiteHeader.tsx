import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Box,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TranslateIcon from '@mui/icons-material/Translate';
import apiClient from '../api/client';

/**
 * Global site header - port of global-site-header-component.js
 */
const SiteHeader: React.FC = () => {
  const [languages, setLanguages] = useState<
    Array<{ code: string; name: string; display: string }>
  >([]);
  const [currentLanguage, setCurrentLanguage] = useState('Language');
  const [langAnchor, setLangAnchor] = useState<HTMLElement | null>(null);
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);

  const baseUrl = (() => {
    let url = window.CI?.base_url || '';
    if (url.endsWith('/index.php')) {
      url = url.slice(0, -10);
    }
    return url;
  })();

  useEffect(() => {
    apiClient
      .get('/api/languages')
      .then((response) => {
        if (response.data?.languages) {
          setLanguages(response.data.languages);
          if (response.data.current_language_title) {
            setCurrentLanguage(response.data.current_language_title);
          }
        }
      })
      .catch((error) => {
        console.error('Error loading languages:', error);
      });
  }, []);

  const pageLink = (page: string) => {
    window.location.href = (window.CI?.site_url || '') + '/' + page;
  };

  const switchLanguage = (lang: string) => {
    const params = new URLSearchParams();
    params.append('language', lang);
    apiClient
      .post('/api/languages/switch', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .then((response) => {
        if (response.data?.status === 'success') {
          window.location.reload();
        }
      })
      .catch((error) => {
        console.error('Error switching language:', error);
      });
    setLangAnchor(null);
  };

  const userInfo = window.CI?.user_info;

  return (
    <AppBar
      position="static"
      sx={{ backgroundColor: 'primary.dark', zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar variant="dense">
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <a
            href={baseUrl}
            style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <img
              src={`${baseUrl}/vue-app/assets/images/logo-white.svg`}
              style={{ height: 20, marginRight: 1 }}
              alt="Logo"
            />
            Metadata Editor
          </a>
        </Typography>

        <Button color="inherit" onClick={() => pageLink('about')}>
          About
        </Button>

        {/* Language menu */}
        <Button
          color="inherit"
          startIcon={<TranslateIcon />}
          onClick={(e) => setLangAnchor(e.currentTarget)}
        >
          {currentLanguage}
        </Button>
        <Menu
          anchorEl={langAnchor}
          open={Boolean(langAnchor)}
          onClose={() => setLangAnchor(null)}
        >
          {languages.map((lang) => (
            <MenuItem key={lang.code} onClick={() => switchLanguage(lang.name)}>
              <ListItemText>{lang.display}</ListItemText>
            </MenuItem>
          ))}
        </Menu>

        {/* User menu */}
        <IconButton color="inherit" onClick={(e) => setUserAnchor(e.currentTarget)}>
          <AccountCircleIcon />
          <Box component="span" sx={{ ml: 0.5, fontSize: 14 }}>
            {userInfo?.username || 'User'}
          </Box>
        </IconButton>
        <Menu
          anchorEl={userAnchor}
          open={Boolean(userAnchor)}
          onClose={() => setUserAnchor(null)}
        >
          <MenuItem onClick={() => { pageLink('auth/profile'); setUserAnchor(null); }}>
            <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { pageLink('auth/change_password'); setUserAnchor(null); }}>
            <ListItemText>Password</ListItemText>
          </MenuItem>
          {userInfo?.is_admin && (
            <MenuItem onClick={() => { pageLink('admin'); setUserAnchor(null); }}>
              <ListItemText>Site Administration</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={() => { pageLink('auth/logout'); setUserAnchor(null); }}>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default SiteHeader;
