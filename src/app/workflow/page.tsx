import { Metadata } from 'next/types';
import { ReactFlowProvider } from '@xyflow/react';

import SidebarLayout from './layouts/sidebar-layout';
import Workflow from './components/workflow';
import { AppStoreProvider } from './store';

export const metadata: Metadata = {
  title: 'React Flow Workflow Template',
  description:
    'A Next.js-based React Flow template designed to help you quickly create, manage, and visualize workflows.',
};

export default function Page() {
  return (
    <AppStoreProvider>
      <ReactFlowProvider>
        <SidebarLayout>
          <Workflow />
        </SidebarLayout>
      </ReactFlowProvider>
    </AppStoreProvider>
  );
}
