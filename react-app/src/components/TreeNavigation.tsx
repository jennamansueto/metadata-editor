import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem as MuiTreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import StorageIcon from '@mui/icons-material/Storage';
import TableChartIcon from '@mui/icons-material/TableChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ListAltIcon from '@mui/icons-material/ListAlt';
import HomeIcon from '@mui/icons-material/Home';
import { Box, Typography } from '@mui/material';
import type { TreeItem } from '../types';
import { useProjectStore } from '../store/useProjectStore';

interface TreeNavigationProps {
  items: TreeItem[];
  searchFilter?: string;
  showRequired?: boolean;
  showRecommended?: boolean;
  showEmpty?: boolean;
}

/**
 * Get the icon for a tree node based on its type
 */
function getNodeIcon(item: TreeItem, isOpen?: boolean): React.ReactNode {
  switch (item.type) {
    case 'home':
      return <HomeIcon fontSize="small" />;
    case 'section_container':
      return <ListAltIcon fontSize="small" />;
    case 'section':
      return isOpen ? (
        <FolderOpenIcon fontSize="small" />
      ) : (
        <FolderIcon fontSize="small" />
      );
    case 'date':
      return <CalendarTodayIcon fontSize="small" />;
    case 'nested_array':
      return <AccountTreeIcon fontSize="small" />;
    case 'array':
      return <TableChartIcon fontSize="small" />;
    case 'simple_array':
      return <ViewColumnIcon fontSize="small" />;
    case 'datafile':
      return <StorageIcon fontSize="small" />;
    case 'variables':
      return <TableChartIcon fontSize="small" />;
    default:
      if (item.display_type === 'dropdown' || item.display_type === 'dropdown-custom') {
        return <DescriptionIcon fontSize="small" />;
      }
      if (item.file === 'database') {
        return <StorageIcon fontSize="small" />;
      }
      if (item.items) {
        return isOpen ? (
          <FolderOpenIcon fontSize="small" />
        ) : (
          <FolderIcon fontSize="small" />
        );
      }
      return <DescriptionIcon fontSize="small" />;
  }
}

/**
 * Recursive tree item renderer
 */
function renderTreeItems(items: TreeItem[], navigate: (path: string) => void, setActiveNode: (node: TreeItem) => void): React.ReactNode {
  return items.map((item) => (
    <MuiTreeItem
      key={item.key}
      nodeId={item.key}
      label={
        <Box
          sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}
          onClick={(e) => {
            e.stopPropagation();
            handleTreeClick(item, navigate, setActiveNode);
          }}
        >
          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
            {getNodeIcon(item)}
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: item.is_required ? 'bold' : 'normal',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={item.title}
          >
            {item.title}
          </Typography>
        </Box>
      }
    >
      {item.items && item.items.length > 0
        ? renderTreeItems(item.items, navigate, setActiveNode)
        : undefined}
    </MuiTreeItem>
  ));
}

/**
 * Handle tree node click - navigate to appropriate route
 */
function handleTreeClick(
  item: TreeItem,
  navigate: (path: string) => void,
  setActiveNode: (node: TreeItem) => void
): void {
  setActiveNode(item);

  switch (item.type) {
    case 'home':
      navigate('/');
      break;
    case 'section_container':
    case 'section':
    case 'array':
    case 'nested_array':
    case 'simple_array':
      navigate(`/study/${item.key}`);
      break;
    case 'datafile':
      navigate(`/datafile/${item.datafile?.file_id || ''}`);
      break;
    case 'variables':
      navigate(`/variables/${item.datafile?.file_id || ''}`);
      break;
    case 'datafiles-folder':
      navigate('/datafiles');
      break;
    case 'resources-folder':
      navigate('/external-resources');
      break;
    case 'resource':
      navigate(`/external-resources/${item.resource?.id || item.index || ''}`);
      break;
    case 'geospatial-feature':
      navigate(`/geospatial-features/edit/${item.feature?.id || ''}`);
      break;
    case 'geospatial-feature-characteristics':
      navigate(`/geospatial-features/${item.feature?.id || ''}/characteristics`);
      break;
    case 'geospatial-features-folder':
    case 'geospatial-features-list':
      navigate('/geospatial-features');
      break;
    case 'metadata-type':
      navigate(`/metadata-types/${item.metadata_type?.id || item.index || ''}`);
      break;
    case 'metadata-types-folder':
      navigate('/metadata-types');
      break;
    default:
      // For template fields, navigate to study route
      if (item.key && !item.items) {
        navigate(`/study/${item.key}`);
      }
      break;
  }
}

const TreeNavigation: React.FC<TreeNavigationProps> = ({
  items,
  searchFilter = '',
}) => {
  const navigate = useNavigate();
  const setActiveNode = useProjectStore((s) => s.setTreeActiveNodeData);

  const filterItems = useCallback(
    (treeItems: TreeItem[]): TreeItem[] => {
      if (!searchFilter || searchFilter.length < 1) {
        return treeItems;
      }

      const keywords = searchFilter.toLowerCase().split(' ');

      const recursiveFilter = (nodeItems: TreeItem[]): TreeItem[] => {
        const filtered: TreeItem[] = [];
        for (const item of nodeItems) {
          // Always include home node
          if (item.type === 'home') {
            filtered.push(item);
            continue;
          }

          if (item.items) {
            const children = recursiveFilter(item.items);
            if (children.length > 0) {
              filtered.push({ ...item, items: children });
            }
          } else {
            const title = item.title.toLowerCase();
            const key = item.key.toLowerCase();
            const helpText = (item.help_text || '').toLowerCase();

            const found = keywords.every(
              (kw) =>
                title.includes(kw) || key.includes(kw) || helpText.includes(kw)
            );

            if (found) {
              filtered.push(item);
            }
          }
        }
        return filtered;
      };

      return recursiveFilter(JSON.parse(JSON.stringify(treeItems)));
    },
    [searchFilter]
  );

  const filteredItems = filterItems(items);

  return (
    <TreeView
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        '& .MuiTreeItem-label': {
          fontSize: '0.875rem',
        },
      }}
    >
      {renderTreeItems(filteredItems, navigate, setActiveNode)}
    </TreeView>
  );
};

export default TreeNavigation;
