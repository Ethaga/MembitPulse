import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center rounded-2xl border border-cyan-400/30 bg-[#0f0f0f]/80 neon-border px-8 py-10">
        <h1 className="text-4xl font-extrabold glow-cyan mb-2">404</h1>
        <p className="text-sm text-foreground/70 mb-6">Route not found: <span className="text-secondary glow-magenta">{location.pathname}</span></p>
        <Link to="/" className="px-4 py-2 rounded-xl border border-cyan-400/40 glow-cyan hover:bg-primary/10">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
