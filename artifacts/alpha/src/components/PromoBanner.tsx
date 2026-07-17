export function PromoBanner() {
  return (
    <div 
      className="w-full h-32 rounded-xl relative overflow-hidden flex items-center px-6"
      data-testid="promo-banner"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-card"></div>
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-black/50 to-transparent"></div>
      <div className="relative z-10">
        <h2 className="text-xl font-bold text-white mb-1">Get 20% Off</h2>
        <p className="text-sm text-white/80">On your first fresh order</p>
      </div>
    </div>
  );
}
