import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

import { AppEdge } from '..';
import { EdgeButton } from './edge-button';

export function WorkflowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  sourceHandleId,
  target,
  style = {},
  markerEnd,
}: EdgeProps<AppEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, pointerEvents: 'auto' }}
      />
      <EdgeButton
        id={id}
        x={labelX}
        y={labelY}
        source={source}
        target={target}
        sourceHandleId={sourceHandleId}
        style={{ ...style }}
      />
    </>
  );
}
