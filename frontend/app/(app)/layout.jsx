// FILE: app/(app)/layout.jsx
// PURPOSE: App route group layout — client component, auth guard wrapper.
//          Socket.IO is initialized here per architecture spec; never in marketing layout.
//          Add socket.io-client initialization in the useEffect below when the package is added.

'use client';

import { useEffect } from 'react';
import AuthGuard from '../../components/AuthGuard';

export default function AppLayout({ children }) {
  useEffect(() => {
    // Socket.IO initialization point — add socket.io-client here when package is added
  }, []);

  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
