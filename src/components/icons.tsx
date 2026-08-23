interface IconProps {
  className?: string
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconHome({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

export function IconTag({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M20.5 12.5 12.5 20.5a1.5 1.5 0 0 1-2.12 0l-6.88-6.88a1.5 1.5 0 0 1 0-2.12l8-8A1.5 1.5 0 0 1 12.56 3H19a1.5 1.5 0 0 1 1.5 1.5v6.44a1.5 1.5 0 0 1-.44 1.06Z" />
      <circle cx="15.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.97 7.97 0 0 0 0-2l2.06-1.6-2-3.46-2.44.98a8 8 0 0 0-1.73-1L15 3h-4l-.3 2.92a8 8 0 0 0-1.73 1l-2.44-.98-2 3.46L6.6 11a7.97 7.97 0 0 0 0 2l-2.06 1.6 2 3.46 2.44-.98a8 8 0 0 0 1.73 1L11 21h4l.3-2.92a8 8 0 0 0 1.73-1l2.44.98 2-3.46Z" />
    </svg>
  )
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconAlert({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.29 2.25h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z" />
    </svg>
  )
}

export function IconCloudOff({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M2 2l20 20" />
      <path d="M9.5 5.5A5.5 5.5 0 0 1 18 10a4.5 4.5 0 0 1 1.6 8.7M6.5 7.6A4.5 4.5 0 0 0 7 16.5h9" />
    </svg>
  )
}

export function IconEdit({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export function IconShare({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 16V4M8 8l4-4 4 4" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </svg>
  )
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}
