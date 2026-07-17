import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] w-full bg-background flex items-center justify-center" data-testid="page-splash">
      <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000">
        <h1 className="text-6xl font-bold tracking-tighter text-white drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">
          al<span className="text-primary">pha</span>
        </h1>
        <div className="mt-4 w-12 h-1 bg-primary rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}
