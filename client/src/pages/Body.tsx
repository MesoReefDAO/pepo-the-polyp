import { ApplicationHeaderSection } from "./sections/ApplicationHeaderSection";
import { ExplorerNavigationSidebarSection } from "./sections/ExplorerNavigationSidebarSection";
import { ReefInsightDashboardSection } from "./sections/ReefInsightDashboardSection";

export const Body = (): JSX.Element => {
  return (
    <div className="flex flex-col items-start relative bg-[#00080c] min-h-screen">
      {/* Background image covering the entire screen */}
      <img
        className="absolute w-full h-full top-0 left-0 object-cover pointer-events-none"
        alt="Fragmented"
        src="/figmaAssets/fragmented-background.svg"
      />
      {/* Application header at the top */}
      <ApplicationHeaderSection />
      {/* Main content area: sidebar + dashboard side by side */}
      <div className="flex flex-row items-start relative self-stretch w-full flex-1 overflow-hidden">
        <ExplorerNavigationSidebarSection />
        <ReefInsightDashboardSection />
      </div>
    </div>
  );
};
