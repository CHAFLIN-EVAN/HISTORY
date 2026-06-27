import type { DynastyNode } from '../types';
import { preQin } from './china/pre-qin';
import { qinHan } from './china/qin-han';
import { weiJin } from './china/wei-jin';
import { suiTang } from './china/sui-tang';
import { song } from './china/song';
import { yuan } from './china/yuan';
import { ming } from './china/ming';
import { qing } from './china/qing';
import { greek } from './europe/greek';
import { rome } from './europe/rome';
import { medieval, modernEurope } from './europe/medieval';
import { egypt, mesopotamia, persia } from './middle-east/egypt';
import { japan, india, americas } from './japan';

export const historyTree: DynastyNode = {
  id: 'root',
  name: '历史资料库',
  nameEn: 'History Database',
  type: 'civilization',
  children: [
    {
      id: 'china',
      name: '中国历史',
      nameEn: 'Chinese History',
      type: 'civilization',
      children: [preQin, qinHan, weiJin, suiTang, song, yuan, ming, qing],
    },
    {
      id: 'europe',
      name: '欧洲历史',
      nameEn: 'European History',
      type: 'civilization',
      children: [greek, rome, medieval, modernEurope],
    },
    {
      id: 'middle-east',
      name: '中东历史',
      nameEn: 'Middle Eastern History',
      type: 'civilization',
      children: [egypt, mesopotamia, persia],
    },
    {
      id: 'japan',
      name: '日本历史',
      nameEn: 'Japanese History',
      type: 'civilization',
      children: japan.children,
    },
    {
      id: 'india',
      name: '印度历史',
      nameEn: 'Indian History',
      type: 'civilization',
      children: india.children,
    },
    {
      id: 'americas',
      name: '美洲历史',
      nameEn: 'American History',
      type: 'civilization',
      children: americas.children,
    },
  ],
};

// 返回所有单个节点（铺平整棵树）
export function flattenTree(node: DynastyNode): DynastyNode[] {
  const result: DynastyNode[] = [node];
  if (node.children) {
    node.children.forEach((child) => {
      result.push(...flattenTree(child));
    });
  }
  return result;
}

// 根据id查找节点
export function findNodeById(root: DynastyNode, id: string): DynastyNode | undefined {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return undefined;
}
