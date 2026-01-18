"use client";

import { useEffect } from 'react';
import { ChannelConnections } from '@/components/seller/ChannelConnections';

// For the dev-only test page we import the component synchronously to avoid dynamic chunk delays
export default function DevChannelConnectionsClient({ searchParams }: { searchParams?: any }) {
  useEffect(() => {
    console.log('[DevTestPage] ChannelConnections client mount', { searchParams });
  }, [searchParams]);

  return <ChannelConnections />;
}
