import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../i18n/TranslationContext';
import axios from 'axios';

interface Language {
  code: string;
  name: string;
  display: string;
}

export default function GlobalSiteHeader() {
  const ci = useAppContext();
  const { t } = useTranslation();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentLanguageTitle, setCurrentLanguageTitle] = useState('Language');
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);

  const baseUrl = (() => {
    let url = ci.base_url || '';
    if (url.endsWith('/index.php')) {
      url = url.slice(0, -10);
    }
    return url.replace(/\/?$/, '/');
  })();

  useEffect(() => {
    axios
      .get(ci.site_url.replace(/\/?$/, '/') + 'api/languages')
      .then((response) => {
        if (response.data?.languages) {
          setLanguages(response.data.languages);
          if (response.data.current_language_title) {
            setCurrentLanguageTitle(response.data.current_language_title);
          }
        }
      })
      .catch((error) => {
        console.error('Error loading languages:', error);
      });
  }, [ci.site_url]);

  function pageLink(page: string) {
    window.location.href = ci.site_url.replace(/\/?$/, '/') + page;
  }

  function switchLanguage(langName: string) {
    const params = new URLSearchParams();
    params.append('language', langName);

    axios
      .post(ci.site_url.replace(/\/?$/, '/') + 'api/languages/switch', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .then((response) => {
        if (response.data?.status === 'success') {
          if (response.data.language_display) {
            setCurrentLanguageTitle(response.data.language_display);
          }
          window.location.reload();
        } else {
          alert('Failed to switch language. Please try again.');
        }
      })
      .catch(() => {
        alert('Error switching language. Please try again.');
      });

    setLangAnchor(null);
  }

  return (
    <AppBar position="static" sx={{ bgcolor: 'primaryDark.main' }}>
      <Toolbar>
        <Box
          component="a"
          href={baseUrl}
          sx={{
            color: 'white',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            component="img"
            src={baseUrl + 'vue-app/assets/images/logo-white.svg'}
            sx={{ height: 20, mr: 0.5 }}
            alt="Logo"
          />
          <Typography variant="h6" component="span">
            Metadata Editor
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Button color="inherit" onClick={() => pageLink('about')}>
          {t('About')}
        </Button>

        {/* Language Switcher */}
        <Button
          color="inherit"
          onClick={(e) => setLangAnchor(e.currentTarget)}
          startIcon={<TranslateIcon />}
        >
          {currentLanguageTitle}
        </Button>
        <Menu
          anchorEl={langAnchor}
          open={Boolean(langAnchor)}
          onClose={() => setLangAnchor(null)}
          sx={{ zIndex: 2000 }}
        >
          {languages.map((lang) => (
            <MenuItem
              key={lang.code}
              onClick={() => switchLanguage(lang.name)}
            >
              {lang.display}
            </MenuItem>
          ))}
        </Menu>

        {/* User Menu */}
        <IconButton
          color="inherit"
          onClick={(e) => setUserAnchor(e.currentTarget)}
          size="large"
        >
          <AccountCircleIcon />
          <Typography sx={{ ml: 0.5 }}>{ci.user_info.username}</Typography>
        </IconButton>
        <Menu
          anchorEl={userAnchor}
          open={Boolean(userAnchor)}
          onClose={() => setUserAnchor(null)}
          sx={{ zIndex: 2000 }}
        >
          <MenuItem onClick={() => pageLink('auth/profile')}>
            {t('profile')}
          </MenuItem>
          <MenuItem onClick={() => pageLink('auth/change_password')}>
            {t('password')}
          </MenuItem>
          {ci.user_info.is_admin && (
            <MenuItem onClick={() => pageLink('admin')}>
              {t('site_administration')}
            </MenuItem>
          )}
          <MenuItem onClick={() => pageLink('auth/logout')}>
            {t('logout')}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
