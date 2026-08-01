import React from 'react';
import MyOrdersPage from './MyOrdersPage';

/**
 * NewOrderPage re-exports MyOrdersPage configured in 'create' mode.
 * Merged into a single unified page to prevent duplicate code.
 */
export default function NewOrderPage() {
  return <MyOrdersPage initialMode="create" />;
}
