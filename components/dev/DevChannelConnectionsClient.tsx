"use client";

import { ChannelConnections } from '@/components/seller/ChannelConnections';

export default function DevChannelConnectionsClient() {
  // Client-side wrapper: define handlers on the client to avoid server-side serialization
  return <ChannelConnections onUpdate={() => { /* no-op for tests */ }} />;
}
