import { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../i18n/TranslationContext';

interface MainNavigationTabsProps {
  activeTab: string;
}

const tabPages = ['editor', 'collections', 'templates', 'schemas', 'tags'];

const tabMap: Record<string, number> = {
  projects: 0,
  collections: 1,
  templates: 2,
  schemas: 3,
  tags: 4,
};

export default function MainNavigationTabs({
  activeTab,
}: MainNavigationTabsProps) {
  const ci = useAppContext();
  const { t } = useTranslation();
  const [value, setValue] = useState<number>(tabMap[activeTab] ?? 0);

  const hasSchemaPermission = (() => {
    if (ci.user_info) {
      if (ci.user_info.has_schema_permission !== undefined) {
        return ci.user_info.has_schema_permission === true;
      }
      return ci.user_info.is_admin === true;
    }
    return false;
  })();

  // Sync value from activeTab prop changes via derived state
  const derivedValue = activeTab && tabMap[activeTab] !== undefined ? tabMap[activeTab] : value;
  if (derivedValue !== value) {
    setValue(derivedValue);
  }

  function handleTabClick(page: string) {
    const siteUrl = (ci.site_url || '').replace(/\/?$/, '/');
    window.location.href = siteUrl + page;
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={value} onChange={(_, newVal) => setValue(newVal)}>
        <Tab
          icon={<DescriptionIcon />}
          iconPosition="start"
          label={t('projects')}
          onClick={() => handleTabClick(tabPages[0])}
        />
        <Tab
          icon={<FolderIcon />}
          iconPosition="start"
          label={t('collections')}
          onClick={() => handleTabClick(tabPages[1])}
        />
        <Tab
          icon={<ViewModuleIcon />}
          iconPosition="start"
          label={t('templates')}
          onClick={() => handleTabClick(tabPages[2])}
        />
        {hasSchemaPermission && (
          <Tab
            icon={<AccountTreeIcon />}
            iconPosition="start"
            label={t('schemas')}
            onClick={() => handleTabClick(tabPages[3])}
          />
        )}
        {hasSchemaPermission && (
          <Tab
            icon={<LocalOfferIcon />}
            iconPosition="start"
            label={t('Tags')}
            onClick={() => handleTabClick(tabPages[4])}
          />
        )}
      </Tabs>
    </Box>
  );
}
