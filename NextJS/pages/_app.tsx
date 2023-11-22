import "../styles/globals.css";
import type { AppProps } from "next/app";
import {
    PROVIDER_ID,
    WalletProvider,
    useInitializeProviders,
} from "@txnlab/use-wallet";
import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";

export default function App({ Component, pageProps }: AppProps) {
    const providers = useInitializeProviders({
        providers: [{ id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect }],
        algosdkStatic: algosdk,
    });

    return (
        <WalletProvider value={providers}>
            <Component {...pageProps} />
        </WalletProvider>
    );
}
