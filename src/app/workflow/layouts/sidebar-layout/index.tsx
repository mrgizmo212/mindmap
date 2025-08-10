'use client';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/workflow/layouts/sidebar-layout/app-sidebar';
import { MarkdownDrawer } from '@/app/workflow/components/markdown-drawer';
import { useAppStore } from '@/app/workflow/store';
import { useCallback } from 'react';

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const markdownDrawer = useAppStore((state) => state.markdownDrawer);
  const nodes = useAppStore((state) => state.nodes);
  
  const handleInsert = useCallback((text: string) => {
    if (!markdownDrawer) return;
    
    // Find the node and trigger insert via custom event
    const node = nodes.find(n => n.id === markdownDrawer.nodeId);
    if (node) {
      window.dispatchEvent(new CustomEvent('markdown-insert', {
        detail: { nodeId: markdownDrawer.nodeId, text }
      }));
    }
  }, [markdownDrawer, nodes]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <main 
        className="flex h-screen w-full flex-col overflow-hidden transition-all duration-200"
        data-drawer-margin={markdownDrawer ? markdownDrawer.width : 0}
      >
        <SidebarTrigger className="ml-2 mt-2 absolute z-50" />
        {children}
      </main>
      <MarkdownDrawer onInsert={handleInsert} />
    </SidebarProvider>
  );
}
