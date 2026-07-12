import type { SVGProps } from 'react';

export type IconName =
  | 'add'
  | 'close'
  | 'drinks'
  | 'droplet'
  | 'history'
  | 'home'
  | 'moon'
  | 'settings'
  | 'sun';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

const paths: Record<IconName, React.ReactNode> = {
  add: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  drinks: <path d="M7 3h10l-1 17H8L7 3Zm.3 5h9.4M10 12h4m-2-2v4" />,
  droplet: (
    <path d="M12 2.8S5.5 9.7 5.5 15a6.5 6.5 0 0 0 13 0C18.5 9.7 12 2.8 12 2.8Z" />
  ),
  history: (
    <path d="M4.9 7.5A8.5 8.5 0 1 1 4 13m.9-5.5H9m-4.1 0V3.4M12 7.5V12l3 2" />
  ),
  home: <path d="m3.5 11 8.5-7 8.5 7M6 9.5V20h12V9.5M10 20v-6h4v6" />,
  moon: <path d="M19.2 15.1A8 8 0 0 1 8.9 4.8 8.5 8.5 0 1 0 19.2 15Z" />,
  settings: (
    <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm7-3.2 2-1-2-3.5-2.2.7a8 8 0 0 0-1.5-.9L14.8 5h-4l-.5 2.3a8 8 0 0 0-1.5.9l-2.2-.7-2 3.5 2 1a7 7 0 0 0 0 1.8l-2 1 2 3.5 2.2-.7a8 8 0 0 0 1.5.9l.5 2.3h4l.5-2.3a8 8 0 0 0 1.5-.9l2.2.7 2-3.5-2-1a7 7 0 0 0 0-1.8Z" />
  ),
  sun: (
    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4m0-12.8L17 7M7 17l-1.4 1.4" />
  ),
};

export function Icon({ name, size = 24, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        {paths[name]}
      </g>
    </svg>
  );
}
