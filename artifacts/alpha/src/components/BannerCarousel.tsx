import { useCallback, useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useBanners, type Banner } from "../hooks/useBanners";

const AUTO_SLIDE_INTERVAL_MS = 4000;
const SWIPE_THRESHOLD_PX = 50;
const CLICK_VS_SWIPE_TOLERANCE_PX = 10;

function getBannerHref(banner: Banner): string {
  if (banner.targetType === "product") return `/product/${banner.targetId}`;
  if (banner.targetType === "category") return `/category/${banner.targetId}`;
  return "/";
}

function BannerSkeleton() {
  return (
    <div className="w-full flex flex-col gap-2" data-testid="banner-carousel-skeleton">
      <div className="w-full h-40 rounded-2xl bg-muted animate-pulse" />
      <div className="flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function BannerCarousel() {
  const { banners, loading, error } = useBanners();
  const navigate = useNavigate();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const count = banners.length;

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActiveIndex(((index % count) + count) % count);
    },
    [count]
  );

  const clearAutoplay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetAutoplay = useCallback(() => {
    clearAutoplay();
    if (count <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, AUTO_SLIDE_INTERVAL_MS);
  }, [count]);

  // Start/restart autoplay whenever the banner set changes
  useEffect(() => {
    resetAutoplay();
    return clearAutoplay;
  }, [resetAutoplay]);

  // Keep active index valid if the banner list shrinks
  useEffect(() => {
    if (count > 0 && activeIndex >= count) setActiveIndex(0);
  }, [count, activeIndex]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setIsDragging(true);
    clearAutoplay();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    touchDeltaX.current = delta;
    setDragOffset(delta);
  };

  const handleTouchEnd = () => {
    const delta = touchDeltaX.current;
    if (delta > SWIPE_THRESHOLD_PX) {
      goTo(activeIndex - 1);
    } else if (delta < -SWIPE_THRESHOLD_PX) {
      goTo(activeIndex + 1);
    }
    setDragOffset(0);
    setIsDragging(false);
    resetAutoplay();
    // touchDeltaX is read by handleBannerClick's synthetic click right after
    // touchend, so clear it on next tick rather than immediately.
    requestAnimationFrame(() => {
      touchStartX.current = null;
      touchDeltaX.current = 0;
    });
  };

  const handleBannerClick = (banner: Banner) => {
    // Ignore taps that were actually swipes
    if (Math.abs(touchDeltaX.current) > CLICK_VS_SWIPE_TOLERANCE_PX) return;
    navigate(getBannerHref(banner));
  };

  if (loading) return <BannerSkeleton />;
  if (error || count === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2" data-testid="banner-carousel">
      <div
        className="relative w-full overflow-hidden rounded-2xl select-none"
        style={{ touchAction: "pan-y" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={trackRef}
          className={`flex ${isDragging ? "" : "transition-transform duration-500 ease-out"}`}
          style={{
            transform: `translateX(calc(${-activeIndex * 100}% + ${dragOffset}px))`,
          }}
        >
          {banners.map((banner) => (
            <button
              type="button"
              key={banner.id}
              onClick={() => handleBannerClick(banner)}
              className="relative w-full flex-shrink-0 h-40 active:opacity-90 transition-opacity"
              data-testid={`banner-${banner.id}`}
            >
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                <p className="text-white font-bold text-base leading-tight drop-shadow-sm">
                  {banner.title}
                </p>
                {banner.subtitle && (
                  <p className="text-white/85 text-xs mt-0.5 drop-shadow-sm">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {count > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {banners.map((banner, i) => (
            <button
              type="button"
              key={banner.id}
              onClick={() => {
                goTo(i);
                resetAutoplay();
              }}
              aria-label={`Go to banner ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
