import React from 'react';
import {
  Button as BaseButton,
  Input,
  Card,
  Badge as BaseBadge,
  Table,
  TableRow,
  TableCell,
  TableSkeleton,
  EmptyState,
  SearchableSelect,
} from './ui/index.js';

const toneByColor = {
  slate: 'neutral',
  brand: 'primary',
  green: 'success',
  orange: 'warning',
  red: 'danger',
};

export const Button = (props) => <BaseButton {...props} />;
export { Input, Card, Table, TableRow, TableCell, TableSkeleton, EmptyState, SearchableSelect };

export const Badge = ({ color, tone, ...props }) => (
  <BaseBadge tone={tone || toneByColor[color] || 'neutral'} {...props} />
);
