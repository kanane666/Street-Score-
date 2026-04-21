interface Props {
  className?: string;
}
export function BasketballIcon({ className }: Props) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="currentColor" />
      <path
        d="M4 32h56M32 4v56M10 10c14 14 30 14 44 0M10 54c14-14 30-14 44 0"
        stroke="#0a0a0a"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
