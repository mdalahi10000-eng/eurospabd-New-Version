export function LotusIcon({ className = "w-8 h-8 text-amber-400" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central petal */}
      <path d="M50 15 C45 35 42 55 50 78 C58 55 55 35 50 15 Z" />
      {/* Inner left petal */}
      <path d="M48 24 C38 40 32 58 46 76 C35 62 34 44 48 24 Z" />
      {/* Inner right petal */}
      <path d="M52 24 C62 40 68 58 54 76 C65 62 66 44 52 24 Z" />
      {/* Outer left petal */}
      <path d="M42 38 C28 50 20 66 38 78 C24 66 26 50 42 38 Z" />
      {/* Outer right petal */}
      <path d="M58 38 C72 50 80 66 62 78 C76 66 74 50 58 38 Z" />
      {/* Base leaves */}
      <path d="M30 76 C40 82 60 82 70 76 C60 86 40 86 30 76 Z" />
    </svg>
  );
}

export function DecorativeFlourish({ className = "text-amber-600/70" }: { className?: string }) {
  return (
    <svg className={className} width="48" height="14" viewBox="0 0 48 14" fill="currentColor">
      <path d="M0 7 L20 7 M28 7 L48 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <polygon points="24,2 29,7 24,12 19,7" fill="currentColor" />
      <circle cx="12" cy="7" r="1.5" fill="currentColor" />
      <circle cx="36" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}
