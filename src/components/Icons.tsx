import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'square',
  'aria-hidden': true,
  focusable: false,
};

export const CheckIcon = () => (
  <svg {...base}>
    <path d="M3 8.5l3.2 3L13 4.5" />
  </svg>
);

export const CrossIcon = () => (
  <svg {...base}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

export const ChevronIcon = () => (
  <svg {...base} width={12} height={12}>
    <path d="M4 6l4 4 4-4" />
  </svg>
);

export const ArrowOutIcon = () => (
  <svg {...base} width={12} height={12}>
    <path d="M5 3h8v8M13 3L4 12" />
  </svg>
);
