import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import {
  ChevronLeft,
  Zap,
  Mail,
  Globe,
  FileText,
  Shield,
  Heart,
  ExternalLink,
} from "lucide-react";

const APP_VERSION = "1.0.0";
const BUILD = "2026.07";

export function AboutAlpha() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-[100dvh] w-full bg-background pb-24 animate-in fade-in duration-300"
      data-testid="page-about"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">About Alpha</h1>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 py-6">
        {/* Brand section */}
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-10 h-10 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h2 className="text-3xl font-black">
              <span className="text-primary">al</span>pha
            </h2>
            <p className="text-sm text-muted-foreground">
              India's fastest grocery delivery
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                v{APP_VERSION}
              </span>
              <span className="text-xs text-muted-foreground">Build {BUILD}</span>
            </div>
          </div>
        </div>

        {/* Company info */}
        <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-xs font-semibold text-muted-foreground">Company</span>
              <span className="text-sm font-semibold">Alpha Commerce Pvt. Ltd.</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-blue-400/10 flex items-center justify-center shrink-0">
              <Mail className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-xs font-semibold text-muted-foreground">Contact Email</span>
              <a
                href="mailto:support@alpha.in"
                className="text-sm font-semibold text-blue-400"
              >
                support@alpha.in
              </a>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
              <Globe className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-xs font-semibold text-muted-foreground">Website</span>
              <span className="text-sm font-semibold text-amber-400">www.alpha.in</span>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Legal */}
        <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
          <button className="flex items-center gap-3 px-4 py-4 active:bg-secondary transition-colors text-left">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <FileText className="w-4.5 h-4.5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-sm font-semibold">Terms of Service</span>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>

          <button className="flex items-center gap-3 px-4 py-4 active:bg-secondary transition-colors text-left">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Shield className="w-4.5 h-4.5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-sm font-semibold">Privacy Policy</span>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Made with love */}
        <div className="flex items-center justify-center gap-1.5 py-4">
          <span className="text-xs text-muted-foreground">Made with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span className="text-xs text-muted-foreground">in India</span>
        </div>

        <p className="text-center text-xs text-muted-foreground px-4">
          © 2026 Alpha Commerce Pvt. Ltd. All rights reserved.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
