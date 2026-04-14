const navItems = [
  {
    label: "Knowledge\nGraph",
    href: "https://pepo.app.bonfires.ai/graph",
    icon: "/figmaAssets/container-1.svg",
    active: true,
  },
  {
    label: "Community",
    href: "https://linktr.ee/mesoreefdao",
    icon: "/figmaAssets/container-2.svg",
    active: false,
  },
];

export const ExplorerNavigationSidebarSection = (): JSX.Element => {
  return (
    <nav className="flex flex-col w-64 min-h-screen items-start justify-between p-6 bg-[#00080c99] border-r border-[#ffffff0d] backdrop-blur-md [-webkit-backdrop-filter:blur(12px)_brightness(100%)]">
      {/* Profile header */}
      <div className="pb-10 flex flex-col items-start w-full">
        <div className="flex items-center gap-3 w-full">
          {/* Avatar */}
          <div className="flex flex-col w-12 h-12 items-start justify-center bg-[#06232c] rounded-[48px] overflow-hidden border border-solid border-[#83eef04c] flex-shrink-0">
            <div className="flex-1 self-stretch w-full bg-[url(/figmaAssets/pepo-the-polyp-mascot.png)] bg-cover bg-[50%_50%]" />
          </div>
          {/* Name and subtitle */}
          <div className="inline-flex flex-col items-start">
            <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-bold text-[#83eef0] text-xl tracking-[0] leading-7 whitespace-nowrap">
              Pepo
            </span>
            <span className="[font-family:'Inter',Helvetica] font-normal text-[#d4e9f380] text-xs tracking-[0] leading-4 whitespace-nowrap">
              The Polyp
            </span>
          </div>
        </div>
      </div>
      {/* Navigation items */}
      <div className="flex flex-col items-start gap-2 flex-1 w-full">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            rel="noopener noreferrer"
            target="_blank"
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-[48px] no-underline ${
              item.active
                ? "bg-[#83eef01a] border border-solid border-[#83eef033]"
                : ""
            }`}
          >
            <img className="flex-shrink-0" alt="Container" src={item.icon} />
            <span
              className={`[font-family:'Plus_Jakarta_Sans',Helvetica] text-base tracking-[0] leading-6 underline whitespace-pre-line ${
                item.active
                  ? "font-bold text-[#83eef0]"
                  : "font-medium text-[#d4e9f380]"
              }`}
            >
              {item.label}
            </span>
          </a>
        ))}
      </div>
      {/* Bottom bordered pill */}
      <div className="flex items-center justify-center pl-[28.11px] pr-[152.87px] py-4 w-full rounded-[48px] border border-solid border-[#83eef033]">
        <div className="w-[24.02px] h-6" />
      </div>
    </nav>
  );
};
