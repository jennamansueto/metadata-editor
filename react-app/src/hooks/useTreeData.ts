import { useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import type { TreeItem, TemplateItem } from '../types';

/**
 * Custom hook to build tree navigation data from the Zustand store.
 * Port of tree data building logic from index_vuetify.php lines 878-1000+
 */
export function useTreeData(): TreeItem[] {
  const treeItems = useProjectStore((s) => s.treeItems);
  const dataFiles = useProjectStore((s) => s.data_files);
  const externalResources = useProjectStore((s) => s.external_resources);
  const geospatialFeatures = useProjectStore((s) => s.geospatial_features);
  const metadataTypes = useProjectStore((s) => s.metadata_types);
  const projectType = useProjectStore((s) => s.project_type);

  const tree = useMemo(() => {
    const items: TreeItem[] = [];

    // Home node
    items.push({
      title: 'Home',
      type: 'home',
      key: '/',
      file: 'folder',
    });

    // Template items (metadata sections)
    if (treeItems && treeItems.length > 0) {
      items.push(...(treeItems as TreeItem[]));
    }

    // Data files
    if (dataFiles.length > 0) {
      const datafileNodes: TreeItem[] = dataFiles.map((file, i) => ({
        title: file.file_name,
        type: 'datafile',
        index: i,
        key: `datafile/${file.file_id}`,
        file: 'datafile',
        datafile: file,
        items: [
          {
            title: 'Variables',
            type: 'variables',
            file: 'variable',
            datafile: file,
            key: `variables/${file.file_id}`,
          },
          {
            title: 'Data',
            type: 'variable_data',
            file: 'table',
            datafile: file,
            key: `d${i}`,
          },
        ],
      }));

      items.push({
        title: 'Data Files',
        type: 'datafiles-folder',
        key: 'datafiles',
        file: 'database',
        items: datafileNodes,
      });
    }

    // External resources
    if (externalResources.length > 0) {
      const resourceNodes: TreeItem[] = externalResources.map((resource) => ({
        title: resource.title,
        type: 'resource',
        index: resource.id,
        file: 'file',
        key: `resource-${resource.id}`,
        resource,
      }));

      items.push({
        title: 'External Resources',
        type: 'resources-folder',
        key: 'external-resources',
        file: 'resource',
        items: resourceNodes,
      });
    }

    // Geospatial features (only for geospatial project type)
    if (projectType === 'geospatial' && geospatialFeatures.length > 0) {
      const featureNodes: TreeItem[] = geospatialFeatures.map((feature) => ({
        title: feature.name || feature.file_name || 'Unnamed Feature',
        type: 'geospatial-feature',
        key: `feature-catalogue/features/${feature.id}`,
        file: 'datafile',
        feature,
        items: [
          {
            title: 'Characteristics',
            type: 'geospatial-feature-characteristics',
            file: 'variable',
            key: `feature-catalogue/features/${feature.id}/characteristics`,
            feature,
          },
        ],
      }));

      items.push({
        title: 'Feature Catalogue',
        type: 'geospatial-features-folder',
        key: 'feature-catalogue/features',
        file: 'database',
        items: featureNodes,
      });
    }

    // Metadata types
    if (metadataTypes.length > 0) {
      const metadataTypeNodes: TreeItem[] = metadataTypes
        .filter((mt) => mt.is_active)
        .map((mt) => ({
          title: mt.name,
          type: 'metadata-type',
          index: mt.id,
          file: 'file',
          key: `metadata-types/${mt.id}`,
          metadata_type: mt,
        }));

      if (metadataTypeNodes.length > 0) {
        items.push({
          title: 'Metadata Types',
          type: 'metadata-types-folder',
          key: 'metadata-types',
          file: 'folder',
          items: metadataTypeNodes,
        });
      }
    }

    return items;
  }, [treeItems, dataFiles, externalResources, geospatialFeatures, metadataTypes, projectType]);

  return tree;
}
