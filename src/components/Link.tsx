import { navigate } from '../router';

interface LinkProps {
  to: string;
  children?: any;
  className?: string;
  onClick?: (e: any) => void;
  target?: string;
  [key: string]: any;
}

/**
 * Crawlable internal link.
 * Renders a real <a href> (so Google can discover the page) but keeps
 * the fast client-side navigation for normal left clicks.
 */
export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const handleClick = (e: any) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    // Let the browser handle new-tab / modified clicks
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (rest.target && rest.target !== '_self') return;
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
