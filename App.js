import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { HistoryProvider } from './context/HistoryContext';

export default function App() {
  return (
    <HistoryProvider>
      <AppNavigator />
    </HistoryProvider>
  );
}
