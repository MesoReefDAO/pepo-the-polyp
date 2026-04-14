import { Link, useLocation } from "wouter";
import { ApplicationHeaderSection } from "./sections/ApplicationHeaderSection";
import { ExplorerNavigationSidebarSection } from "./sections/ExplorerNavigationSidebarSection";
import { ReefInsightDashboardSection } from "./sections/ReefInsightDashboardSection";

function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 pt-3 pb-safe bg-[#00080cf5] border-t border-[#ffffff0d] backdrop-blur-xl" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
      {/* Chat (home) */}
      <Link href="/" className={`flex flex-col items-center gap-1 no-underline transition-opacity ${location === "/" ? "opacity-100" : "opacity-50"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke={location === "/" ? "#83eef0" : "#d4e9f380"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className={`text-[9px] font-medium ${location === "/" ? "text-[#83eef0]" : "text-[#d4e9f380]"}`}>Chat</span>
      </Link>

      {/* Knowledge Graph */}
      <a href="https://pepo.app.bonfires.ai/graph" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 no-underline opacity-50">
        <img src="/figmaAssets/container-1.svg" className="w-[22px] h-[22px]" alt="Graph" />
        <span className="text-[9px] text-[#d4e9f380]">Graph</span>
      </a>

      {/* Profile */}
      <Link href="/profile" className={`flex flex-col items-center gap-1 no-underline transition-opacity ${location === "/profile" ? "opacity-100" : "opacity-50"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 21V19C20 17.9 19.1 17 18 17H6C4.9 17 4 17.9 4 19V21" stroke={location === "/profile" ? "#83eef0" : "#d4e9f380"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="9" r="4" stroke={location === "/profile" ? "#83eef0" : "#d4e9f380"} strokeWidth="2"/>
        </svg>
        <span className={`text-[9px] ${location === "/profile" ? "text-[#83eef0] font-medium" : "text-[#d4e9f380]"}`}>Profile</span>
      </Link>

      {/* Community */}
      <a href="https://linktr.ee/mesoreefdao" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 no-underline opacity-50">
        <img src="/figmaAssets/container-2.svg" className="w-[22px] h-[22px]" alt="Community" />
        <span className="text-[9px] text-[#d4e9f380]">Community</span>
      </a>

      {/* Telegram */}
      <a href="https://t.me/PepothePolyp_bot" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 no-underline opacity-50">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.67l-2.948-.924c-.64-.203-.652-.64.136-.954l11.5-4.433c.536-.194 1.006.131.836.862z" fill="#d4e9f380"/>
        </svg>
        <span className="text-[9px] text-[#d4e9f380]">Telegram</span>
      </a>
    </nav>
  );
}

export const Body = (): JSX.Element => {
  return (
    <div className="flex flex-col items-start relative bg-[#00080c] min-h-screen">
      <img
        className="absolute w-full h-full top-0 left-0 object-cover pointer-events-none"
        alt="Background"
        src="/figmaAssets/coral-microbiome-bg.jpg"
      />
      <div className="absolute w-full h-full top-0 left-0 pointer-events-none bg-[#00080c]/70" />

      <ApplicationHeaderSection />

      <div className="flex flex-row items-start relative self-stretch w-full flex-1 overflow-hidden">
        {/* Sidebar: hidden on mobile */}
        <div className="hidden md:block">
          <ExplorerNavigationSidebarSection />
        </div>
        {/* Main content: full width on mobile */}
        <ReefInsightDashboardSection />
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
};
