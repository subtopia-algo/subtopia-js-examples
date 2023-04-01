import "../styles/globals.css";
import type { AppProps } from "next/app";
import {
  WalletProvider,
  initializeProviders,
  PROVIDER_ID,
} from "@txnlab/use-wallet";
import { walletProviders } from "../utils/providers";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider value={walletProviders}>
      <Component {...pageProps} />
    </WalletProvider>
  );
}
