'use client';

import { useState, useCallback, ComponentProps, useRef } from 'react';
import { Command, GripVertical, Plus, Moon, Sun, Settings2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useReactFlow } from '@xyflow/react';
import { useTheme } from 'next-themes';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { SettingsDialog } from '@/app/workflow/components/settings-dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenu,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AppNode,
  createNodeByType,
  type NodeConfig,
} from '@/app/workflow/components/nodes';
import { cn } from '@/lib/utils';
import { iconMapping } from '@/app/workflow/utils/icon-mapping';
import { useAppStore } from '@/app/workflow/store';
import { type AppStore } from '@/app/workflow/store/app-store';
import { nodesConfig } from '../../config';

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="py-0">
        <div className="flex gap-2 px-1 h-14 items-center ">
          <div className="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Command className="size-3" />
          </div>
          <span className="truncate font-semibold">Prompt Editor</span>
        </div>
        <SidebarMenu>
          {Object.values(nodesConfig).map((item) => {
            // Comment out demo/visual-only nodes (only show markdown and separator nodes)
            const demoNodes = ['initial-node', 'transform-node', 'branch-node', 'join-node', 'output-node'];
            if (demoNodes.includes(item.id)) {
              return null; // Skip rendering demo nodes
            }
            return <DraggableItem key={item.title} {...item} />
          })}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            <SettingsSection />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <SettingsDialog />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

const selector = (state: AppStore) => ({
  addNode: state.addNode,
  checkForPotentialConnection: state.checkForPotentialConnection,
  resetPotentialConnection: state.resetPotentialConnection,
});

const settingsSelector = (state: AppStore) => ({
  isFixedLayout: state.layout === 'fixed',
  toggleLayout: state.toggleLayout,
});

function SettingsSection() {
  const { isFixedLayout, toggleLayout } = useAppStore(useShallow(settingsSelector));
  const { setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-sm font-medium">Theme</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <Sun className="h-[1rem] w-[1rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-[1rem] w-[1rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-sm font-medium">Fixed Layout</span>
        <Switch checked={isFixedLayout} onCheckedChange={toggleLayout} />
      </div>
    </div>
  );
}

function DraggableItem(props: NodeConfig) {
  const { screenToFlowPosition } = useReactFlow();
  const { addNode, checkForPotentialConnection, resetPotentialConnection } =
    useAppStore(useShallow(selector));
  const [isDragging, setIsDragging] = useState(false);

  const onClick = useCallback(() => {
    const newNode: AppNode = createNodeByType({
      type: props.id,
      position: screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }),
    });

    addNode(newNode);
  }, [props, addNode, screenToFlowPosition]);

  const onDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('application/reactflow', JSON.stringify(props));
      setIsDragging(true);
    },
    [props],
  );

  const lastDragPos = useRef({ x: 0, y: 0 });
  const onDrag = useCallback(
    (e: React.DragEvent) => {
      const lastPos = lastDragPos.current;
      // we need to keep track of the last drag position to avoid unnecessary calculations
      // the drag api constantly fires events even if the mouse is not moving
      if (lastPos.x === e.clientX && lastPos.y === e.clientY) {
        return;
      }
      lastDragPos.current = { x: e.clientX, y: e.clientY };

      const flowPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      const handles = nodesConfig[props.id].handles.map(
        (handle) => handle.type,
      );
      const handleType = handles.reduce(
        (acc, type) => {
          if (acc === 'none') return type;
          if (acc !== 'both' && acc !== type) return 'both';
          return acc;
        },
        'none' as 'both' | 'none' | 'source' | 'target',
      );

      if (handleType === 'none') return;

      checkForPotentialConnection(flowPosition, {
        type: handleType === 'both' ? undefined : handleType,
      });
    },
    [screenToFlowPosition, checkForPotentialConnection, props.id],
  );

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
    resetPotentialConnection();
  }, [resetPotentialConnection]);

  const IconComponent = props?.icon ? iconMapping[props.icon] : undefined;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarMenuItem
          className={cn(
            'relative border-2 active:scale-[.99] rounded-md',
            isDragging ? 'border-green-500' : 'border-gray-100',
          )}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onClick={onClick}
          draggable
          key={props.title}
        >
          {isDragging && (
            <span
              role="presentation"
              className="absolute -top-3 -right-3 rounded-md border-2 border-green-500 bg-card"
            >
              <Plus className="size-4" />
            </span>
          )}
          <SidebarMenuButton className="bg-card cursor-grab active:cursor-grabbing">
            {IconComponent ? <IconComponent aria-label={props?.icon} /> : null}
            <span>{props.title}</span>
            <GripVertical className="ml-auto" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </TooltipTrigger>
      {props.tooltip && (
        <TooltipContent side="right" className="max-w-[300px]">
          <p>{props.tooltip}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
