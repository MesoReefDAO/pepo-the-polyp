import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const footerLinks = [
  { label: "PRIVACY", href: "https://mesoreefdao.gitbook.io/privacy-policy" },
  {
    label: "TERMS",
    href: "https://mesoreefdao.gitbook.io/terms-and-conditions",
  },
  { label: "CONSERVATION", href: "https://mesoreefdao.org/science-ai" },
];

const statsData = [
  {
    label: "KNOWLEDGE DENSITY",
    value: "8.4",
    unit: "TB",
    valueClass: "text-[#83eef0]",
    unitClass: "opacity-50 text-[#657881]",
    renderValue: () => (
      <div className="relative self-stretch w-full h-8">
        <div className="absolute top-0 left-0 h-8 flex items-center [font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#83eef0] text-2xl tracking-[0] leading-8 whitespace-nowrap">
          8.4
        </div>
        <div className="absolute top-3.5 left-11 h-4 flex items-center opacity-50 [font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#657881] text-xs tracking-[0] leading-4 whitespace-nowrap">
          TB
        </div>
      </div>
    ),
  },
  {
    label: "NETWORK HEALTH",
    value: "99.2%",
    renderValue: () => (
      <div className="flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
        <div className="relative w-2 h-2 bg-[#f9a414] rounded-full shadow-[0px_0px_8px_#f9a414]" />
        <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
          <div className="relative flex items-center w-fit mt-[-1.00px] [font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-2xl tracking-[0] leading-8 whitespace-nowrap">
            99.2%
          </div>
        </div>
      </div>
    ),
  },
];

export const ReefInsightDashboardSection = (): JSX.Element => {
  return (
    <div className="flex items-start gap-6 p-6 relative flex-1 self-stretch grow">
      {/* Left Panel: Chat Interface */}
      <div className="flex flex-col items-start justify-between p-6 relative flex-1 self-stretch grow bg-[#001017bf] rounded-[48px] overflow-hidden border border-solid border-[#83eef01a] backdrop-blur-lg backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(16px)_brightness(100%)]">
        {/* Header */}
        <div className="pt-0 pb-8 px-0 flex-[0_0_auto] flex flex-col items-start relative self-stretch w-full">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex items-center gap-3 relative flex-[0_0_auto]">
              <img
                className="relative flex-[0_0_auto]"
                alt="Container"
                src="/figmaAssets/container.svg"
              />
              <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
                <div className="relative flex items-center w-fit mt-[-1.00px] [font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#d4e9f3] text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Coral Reef Knowledge
                </div>
              </div>
            </div>
            <Badge className="px-3 py-1 bg-[#83eef01a] rounded-full border border-solid border-[#83eef033] [font-family:'Inter',Helvetica] font-medium text-[#83eef0] text-xs tracking-[1.20px] leading-4 whitespace-nowrap hover:bg-[#83eef01a]">
              ACTIVE LINK
            </Badge>
          </div>
        </div>
        {/* Chat Messages */}
        <div className="justify-center pt-0 pb-6 px-0 flex-1 grow flex flex-col items-start relative self-stretch w-full">
          <div className="relative flex-1 self-stretch w-full grow">
            {/* Message 1: Pepo greeting */}
            <div className="flex max-w-[426.7px] w-[calc(100%_-_82px)] items-start gap-4 absolute top-0 left-0">
              <div className="flex flex-col w-10 h-10 items-start justify-center relative bg-[#ffffff01] rounded-full overflow-hidden border border-solid border-[#83eef066] shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a] flex-shrink-0">
                <div className="bg-[url(/figmaAssets/pepo.png)] relative flex-1 self-stretch w-full grow bg-cover bg-[50%_50%]" />
              </div>
              <div className="inline-flex flex-col items-start gap-[8.12px] pl-5 pr-[24.7px] py-5 relative self-stretch flex-[0_0_auto] bg-[#0a293366] rounded-[0px_48px_48px_48px] border border-solid border-[#ffffff0d] backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)]">
                <p className="relative w-fit [font-family:'Inter',Helvetica] font-normal text-[#d4e9f3] text-sm tracking-[0] leading-5">
                  Greetings, Explorer. I am Pepo. I&#39;ve mapped
                  <br />
                  3,420 new node connections in the
                  <br />
                  MesoAmerican reef today. Which quadrant shall
                  <br />
                  we analyze?
                </p>
                <time className="relative flex items-center w-fit opacity-60 [font-family:'Inter',Helvetica] font-normal text-[#9aaeb8] text-[10px] tracking-[0] leading-[16.2px] whitespace-nowrap">
                  10:24 AM
                </time>
              </div>
            </div>
            {/* Message 2: User message */}
            <div className="flex max-w-[426.7px] w-[calc(100%_-_82px)] items-start gap-4 absolute top-[170px] left-[74px]">
              <div className="inline-flex flex-col items-start gap-[8.5px] p-5 relative self-stretch flex-[0_0_auto] bg-[#83eef026] rounded-[48px_0px_48px_48px] border border-solid border-[#83eef033] backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)]">
                <p className="relative w-fit [font-family:'Inter',Helvetica] font-normal text-[#d4e9f3] text-sm tracking-[0] leading-5">
                  Show me the correlation between coral
                  <br />
                  bleaching events in Sector 7 and the current
                  <br />
                  DAO governance proposals.
                </p>
                <div className="inline-flex flex-col items-end pl-[277.84px] pr-0 py-0 relative flex-[0_0_auto]">
                  <time className="relative flex items-center justify-end w-fit mt-[-1.00px] [font-family:'Inter',Helvetica] font-normal text-[#74dfe299] text-[10px] text-right tracking-[0] leading-[16.2px] whitespace-nowrap">
                    10:25 AM
                  </time>
                </div>
              </div>
              <img
                className="relative w-10 h-10 flex-shrink-0"
                alt="Overlay border"
                src="/figmaAssets/overlay-border.svg"
              />
            </div>
            {/* Message 3: Pepo response with insight */}
            <div className="flex max-w-[451.8px] w-[calc(100%_-_57px)] items-start gap-4 absolute top-80 left-0">
              <div className="flex flex-col w-10 h-10 items-start justify-center relative rounded-full overflow-hidden border border-solid border-[#83eef066] flex-shrink-0">
                <div className="bg-[url(/figmaAssets/pepo-1.png)] relative flex-1 self-stretch w-full grow bg-cover bg-[50%_50%]" />
              </div>
              <div className="inline-flex gap-[16.5px] self-stretch flex-[0_0_auto] bg-[#0a293366] rounded-[0px_48px_48px_48px] border-[#ffffff0d] backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] flex-col items-start p-5 relative border border-solid">
                <p className="relative w-fit [font-family:'Inter',Helvetica] font-normal text-[#d4e9f3] text-sm tracking-[0] leading-5">
                  Found it! There is a high-density cluster connecting
                  <br />
                  **Proposal #82 (Reef Guard)** and the **Sector 7<br />
                  Heat Mapping** data. View the graph nodes
                  <br />
                  highlighted in cyan.
                </p>
                {/* Insight card */}
                <div className="inline-flex items-center gap-4 p-4 relative flex-[0_0_auto] bg-[#00000066] rounded-[32px] border border-solid border-[#83eef01a]">
                  <img
                    className="relative flex-[0_0_auto]"
                    alt="Overlay"
                    src="/figmaAssets/overlay.svg"
                  />
                  <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
                    <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                      <span className="relative flex items-center w-fit mt-[-1.00px] [font-family:'Inter',Helvetica] font-normal text-[#83eef0] text-xs tracking-[0] leading-4 whitespace-nowrap">
                        Insight Detected
                      </span>
                    </div>
                    <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] opacity-70">
                      <p className="relative w-fit mt-[-1.00px] [font-family:'Inter',Helvetica] font-normal text-[#9aaeb8] text-[11px] tracking-[0] leading-[16.5px]">
                        87% correlation with local temperature
                        <br />
                        spikes
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex flex-col items-center justify-center relative flex-[0_0_auto]">
                    <span className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter',Helvetica] font-normal text-[#f9a414] text-xs text-center tracking-[0] leading-4 underline whitespace-nowrap cursor-pointer">
                      Export
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Input Area */}
        <div className="flex-col flex items-start relative self-stretch w-full flex-[0_0_auto]">
          <div className="justify-center pl-6 pr-16 pt-[17px] pb-[18px] bg-[#00000099] rounded-[48px] overflow-hidden border border-solid border-[#ffffff1a] backdrop-blur-[6px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(6px)_brightness(100%)] flex items-start relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start relative flex-1 grow">
              <span className="relative flex items-center self-stretch mt-[-1.00px] [font-family:'Inter',Helvetica] font-normal text-[#65788166] text-sm tracking-[0] leading-[normal]">
                Inquire within the Regen Reef Realm...
              </span>
            </div>
          </div>
          <img
            className="absolute top-[calc(50.00%_-_22px)] right-6 w-16 h-16"
            alt="Button"
            src="/figmaAssets/button.svg"
          />
        </div>
      </div>
      {/* Right Panel: Graph + Stats + Footer */}
      <div className="flex flex-col w-[400px] items-start gap-6 relative self-stretch">
        {/* Graph visualization */}
        <img
          className="relative flex-1 self-stretch w-full grow"
          alt="Main graph view"
          src="/figmaAssets/main-graph-view.svg"
        />
        {/* Stats Cards */}
        <div className="grid grid-cols-2 grid-rows-[93px] h-fit gap-4 w-full">
          {statsData.map((stat, index) => (
            <Card
              key={index}
              className="w-full h-fit flex gap-1 bg-[#00000066] rounded-[48px] border border-solid border-[#ffffff1a] backdrop-blur-md backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(12px)_brightness(100%)] shadow-none"
            >
              <CardContent className="flex flex-col items-start p-5 gap-1 w-full">
                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] opacity-70">
                  <span className="flex items-center self-stretch [font-family:'Inter',Helvetica] font-normal text-[#657881] text-[10px] tracking-[1.00px] leading-[15px] relative mt-[-1.00px]">
                    {stat.label}
                  </span>
                </div>
                {stat.renderValue()}
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Footer Card */}
        <Card className="flex flex-col items-center gap-4 px-0 py-6 relative self-stretch w-full flex-[0_0_auto] bg-[#00000066] rounded-[48px] border border-solid border-[#ffffff1a] backdrop-blur-md backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(12px)_brightness(100%)] shadow-none">
          <CardContent className="flex flex-col items-center gap-4 p-0 w-full">
            {/* Footer links */}
            <nav className="inline-flex items-start gap-6 relative flex-[0_0_auto]">
              {footerLinks.map((link) => (
                <div
                  key={link.label}
                  className="inline-flex flex-col items-start relative self-stretch flex-[0_0_auto]"
                >
                  <a
                    className="relative flex items-center w-fit mt-[-1.00px] [font-family:'Inter',Helvetica] font-normal text-[#d4e9f366] text-[10px] tracking-[1.00px] leading-[15px] underline whitespace-nowrap"
                    href={link.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </a>
                </div>
              ))}
            </nav>
            {/* Copyright info */}
            <div className="inline-flex flex-col items-center gap-1 relative flex-[0_0_auto] opacity-60">
              <span className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter',Helvetica] font-normal text-[#d4e9f3] text-[8px] text-center tracking-[0] leading-3 whitespace-nowrap">
                Copyright © 2026 MesoReef DAO.
              </span>
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                <span className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter',Helvetica] font-normal text-[#d4e9f3] text-[8px] text-center tracking-[0] leading-3 whitespace-nowrap">
                  <span className="[font-family:'Inter',Helvetica] font-normal text-[#d4e9f3] text-[8px] tracking-[0] leading-3">
                    Powered by{" "}
                  </span>
                  <a
                    href="https://bonfires.ai/"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="underline">Bonfires.ai</span>
                  </a>
                </span>
                <div className="relative w-[43px] h-2.5 bg-[url(/figmaAssets/bonfires-ai-logo.png)] bg-cover bg-[50%_50%]" />
              </div>
              <span className="relative flex items-center justify-center w-fit [font-family:'Inter',Helvetica] font-normal text-[#d4e9f3] text-[8px] text-center tracking-[0] leading-3 whitespace-nowrap">
                All Rights Reserved.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
