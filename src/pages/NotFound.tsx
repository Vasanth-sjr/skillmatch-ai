import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--ag-bg]">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-['Syne'] font-extrabold text-[--ag-text]">404</h1>
        <p className="mb-6 text-xl text-[--ag-muted]">Oops! Page not found</p>
        <a href="/" className="px-6 py-3 border border-[--ag-accent] text-[--ag-accent] hover:bg-[--ag-accent-dim] font-bold uppercase tracking-wider text-sm transition-colors rounded-none">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
