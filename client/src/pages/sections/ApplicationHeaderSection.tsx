import { Button } from "@/components/ui/button";

// Navigation links data
const navLinks = [
  { label: "MesoReef DAO", href: "https://mesoreefdao.org/" },
  { label: "ReefRegen", href: "https://reefregen.org/" },
  { label: "Join", href: "https://linktr.ee/mesoreefdao" },
];

export const ApplicationHeaderSection = (): JSX.Element => {
  return (
    <header className="flex w-full items-center justify-between px-8 py-4 border-b border-[#ffffff0d] backdrop-blur-[20px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(20px)_brightness(100%)] bg-[linear-gradient(180deg,rgba(0,22,30,1)_0%,rgba(0,16,23,0.4)_100%),linear-gradient(0deg,rgba(0,8,12,0.8)_0%,rgba(0,8,12,0.8)_100%)]">
      {/* Logo */}
      <div className="w-[137.28px] h-12 bg-[url(/figmaAssets/mesoreef-dao.png)] bg-cover bg-[50%_50%] flex-shrink-0" />
      {/* Navigation links */}
      <nav className="inline-flex items-center gap-8">
        {navLinks.map((link) => (
          <a
            key={link.label}
            className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-normal text-[#d4e9f3b2] text-base tracking-[-0.40px] leading-6 underline whitespace-nowrap"
            href={link.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {link.label}
          </a>
        ))}
      </nav>
      {/* Log in button */}
      <Button
        className="relative inline-flex items-center justify-center px-6 py-2 h-auto rounded-full bg-[linear-gradient(170deg,rgba(131,238,240,1)_0%,rgba(63,176,179,1)_100%)] border-none shadow-none hover:opacity-90 transition-opacity"
        asChild={false}
      >
        {/* Inner glow overlay */}
        <span className="absolute inset-0 bg-[#ffffff01] rounded-full shadow-[0px_4px_6px_-4px_#83eef033,0px_10px_15px_-3px_#83eef033]" />
        <span className="relative [font-family:'Inter',Helvetica] font-normal text-[#00585a] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
          Log in
        </span>
      </Button>
    </header>
  );
};
