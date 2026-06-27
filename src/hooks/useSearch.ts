import { useState, useCallback, useMemo } from 'react';
import type { DynastyNode } from '../types';
import { flattenTree } from '../data';

export function useSearch(root: DynastyNode) {
  const [query, setQuery] = useState('');
  const allNodes = useMemo(() => flattenTree(root), [root]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allNodes
      .filter(
        (n) =>
          n.name.includes(q) ||
          n.nameEn?.toLowerCase().includes(q) ||
          n.content?.tags.some((t) => t.toLowerCase().includes(q)) ||
          n.content?.overview.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [query, allNodes]);

  // 获取需要展开的节点ID列表（使搜索结果可见）
  const expandedIds = useMemo(() => {
    if (!query.trim()) return new Set<string>();
    const ids = new Set<string>();
    const resultIds = new Set(results.map((r) => r.id));

    function collectAncestors(node: DynastyNode, ancestors: string[]) {
      const path = [...ancestors, node.id];
      if (resultIds.has(node.id)) {
        path.forEach((id) => ids.add(id));
      }
      if (node.children) {
        node.children.forEach((c) => collectAncestors(c, path));
      }
    }
    collectAncestors(root, []);
    return ids;
  }, [query, results, root]);

  const clearSearch = useCallback(() => setQuery(''), []);

  return { query, setQuery, results, expandedIds, clearSearch };
}
