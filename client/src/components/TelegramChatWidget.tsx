import { useState, useEffect, useRef } from "react";
import pepoPng from "@assets/MesoReefDAO_Pepo_The_Polyp_1776218616437.png";

const TELEGRAM_WEB_URL = "https://web.telegram.org/k/#@PepothePolyp_bot";

let popupRef: Window | null = null;

function openTelegramPopup() {
  if (popupRef && !popupRef.closed) {
    popupRef.focus();
    return;
  }

  const w = 420;
  const h = 680;
  const left = Math.max(0, window.screenX + window.outerWidth - w - 24);
  const top = Math.max(0, window.screenY + window.outerHeight - h - 80);

  popupRef = window.open(
    TELEGRAM_WEB_URL,
    "pepo_telegram_chat",
    `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
  );
}

export function TelegramChatWidget() {
  const [showPulse, setShowPulse] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setShowPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Poll to track whether the popup is open
  useEffect(() => {
    if (popupOpen) {
      intervalRef.current = setInterval(() => {
        if (!popupRef || popupRef.closed) {
          setPopupOpen(false);
          popupRef = null;
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 600);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [popupOpen]);

  const handleClick = () => {
    setShowPulse(false);
    if (popupRef && !popupRef.closed) {
      popupRef.focus();
      return;
    }
    openTelegramPopup();
    setPopupOpen(true);
  };

  return (
    <div
      className="fixed right-4 md:right-6 z-[60] flex flex-col items-end gap-3"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px + 12px)" }}
    >
      {/* Tooltip label — visible briefly or on hover */}
      {!popupOpen && (
        <div
          className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#229ED930] opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            background: "rgba(0,8,12,0.90)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          <span className="text-[#d4e9f3] text-xs [font-family:'Inter',Helvetica] whitespace-nowrap font-medium">
            Chat with Pepo
          </span>
        </div>
      )}

      {/* Floating Pepo button */}
      <button
        onClick={handleClick}
        aria-label={popupOpen ? "Bring chat to front" : "Chat with Pepo on Telegram"}
        data-testid="button-pepo-chat-widget"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #229ED9 0%, #1a7fad 100%)",
          boxShadow: popupOpen
            ? "0 4px 24px rgba(34,158,217,0.7), 0 2px 8px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(34,158,217,0.5), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        <img
          src={pepoPng}
          alt="Pepo"
          className="w-10 h-10 rounded-full object-cover object-center"
        />

        {/* Tooltip on hover — shown below the button */}
        <span
          className="absolute bottom-full mb-2.5 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#d4e9f3] [font-family:'Inter',Helvetica]"
          style={{ background: "rgba(0,8,12,0.88)", border: "1px solid rgba(34,158,217,0.25)" }}
        >
          {popupOpen ? "Bring to front" : "Chat with Pepo"}
        </span>

        {/* Pulse ring (first 5 s) */}
        {!popupOpen && showPulse && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-50"
            style={{ background: "#229ED9" }}
          />
        )}

        {/* Online dot / active indicator */}
        <span
          className={`absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#00080c] transition-colors ${
            popupOpen ? "bg-[#83eef0]" : "bg-[#2ecc71]"
          }`}
        />
      </button>
    </div>
  );
}
