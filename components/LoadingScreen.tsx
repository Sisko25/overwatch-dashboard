import Image from 'next/image';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-void text-matrix">
      <div className="flex items-center gap-6 mb-8 animate-pulse">
        {/* Singapore Crest - Increased size to w-28 h-28 (~30-40% bigger) */}
        <div className="relative w-28 h-28">
          <Image 
            src="/sgcoat.svg" 
            alt="Singapore Coat of Arms" 
            fill
            className="object-contain drop-shadow-[0_0_15px_rgba(0,255,157,0.6)]"
            priority
          />
        </div>
        <h1 className="text-6xl font-bold tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(0,255,157,0.8)]">
          OVERWATCH-SG
        </h1>
      </div>
      
      {/* Loading Spinner */}
      <div className="relative flex items-center justify-center">
        {/* Outer Ring */}
        <div className="w-16 h-16 border-4 border-matrix/30 border-t-matrix rounded-full animate-spin"></div>
        {/* Inner Pulsing Dot */}
        <div className="absolute w-6 h-6 bg-matrix rounded-full animate-ping opacity-50"></div>
        <div className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_15px_#00ff9d]"></div>
      </div>
      <div className="mt-6 text-xs font-mono tracking-widest opacity-70 animate-pulse">
        ESTABLISHING SECURE UPLINK...
      </div>
    </div>
  );
}