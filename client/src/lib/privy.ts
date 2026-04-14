export const PRIVY_APP_ID = (import.meta.env.VITE_PRIVY_APP_ID as string) || "";
export const PRIVY_ENABLED = PRIVY_APP_ID.length > 10;
