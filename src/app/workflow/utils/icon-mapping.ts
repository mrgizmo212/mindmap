import {
  Rocket,
  Spline,
  Split,
  Merge,
  CheckCheck,
  Ban,
  FileText,
  Minus,
  // Import other icons as needed
} from 'lucide-react';

export const iconMapping: Record<
  string,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  Rocket: Rocket,
  Spline: Spline,
  Split: Split,
  Merge: Merge,
  CheckCheck: CheckCheck,
  Ban: Ban,
  FileText: FileText,
  Minus: Minus,
  // Add other mappings here
};
