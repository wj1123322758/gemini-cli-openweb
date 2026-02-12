import { CONFIG } from '../config/index.js';

export const CATEGORY_THEMES = {
  '需求': {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    button: 'bg-blue-500 text-white',
    label: '需求'
  },
  '修复': {
    badge: 'bg-red-500/10 text-red-400 border-red-500/30',
    button: 'bg-red-500 text-white',
    label: '修复'
  },
  '优化': {
    badge: 'bg-green-500/10 text-green-400 border-green-500/30',
    button: 'bg-green-500 text-white',
    label: '优化'
  },
  '杂项': {
    badge: 'bg-white/5 text-white/40 border-white/10',
    button: 'bg-gray-500 text-white',
    label: '杂项'
  }
};

export const STATUS_THEMES = {
  'todo': {
    color: 'text-lab-text-dim/40',
    label: '待办',
    bg: 'bg-lab-primary/10'
  },
  'doing': {
    color: 'text-yellow-500',
    label: '进行中',
    bg: 'bg-yellow-500/10'
  },
  'done': {
    color: 'text-green-500/60',
    label: '已完成',
    bg: 'bg-green-500/10'
  }
};

export function getCategoryTheme(category) {
  return CATEGORY_THEMES[category] || CATEGORY_THEMES['杂项'];
}

export function getStatusTheme(status) {
  return STATUS_THEMES[status] || STATUS_THEMES['todo'];
}

export const CATEGORIES = CONFIG.CATEGORIES;
