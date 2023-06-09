import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "../styles/Home.module.css";
import { useWallet, reconnectProviders } from "@txnlab/use-wallet";
import { useState, useEffect } from "react";
import { walletProviders } from "../utils/providers";
import { SubtopiaClient, SubscriptionExpirationType } from "subtopia-js";
import algosdk from "algosdk";
import { useAsyncRetry } from "react-use";

const inter = Inter({ subsets: ["latin"] });

export function ellipseAddress(address = ``, width = 6): string {
    return `${address.slice(0, width)}...${address.slice(-width)}`;
}

const testNetAlgodClient = new algosdk.Algodv2(
    ``,
    `https://testnet-api.algonode.cloud`,
    ``
);

const DUMMY_SMI_ID = 190521162;

export default function Home() {
    const { activeAddress, providers, signer } = useWallet();
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const subscriptionResponse = useAsyncRetry(async () => {
        if (!activeAddress) {
            return undefined;
        }

        return await SubtopiaClient.getSubscriptionRecordForAccount(
            testNetAlgodClient,
            activeAddress,
            DUMMY_SMI_ID
        );
    }, [activeAddress]);

    useEffect(() => {
        reconnectProviders(walletProviders);
    }, []);

    return (
        <>
            <Head>
                <title>Create Next App</title>
                <meta
                    name="description"
                    content="Generated by create next app"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className={styles.main}>
                <div className={styles.center}>
                    <Image
                        className={styles.logo}
                        src="https://ipfs.io/ipfs/bafybeietopj64xoicecmuruwcn7n2vijfgffrcv3ur4vw3qh477ezllchm"
                        alt="Next.js Logo"
                        width={300}
                        height={100}
                        priority
                    />
                </div>
                {activeAddress && (
                    <p
                        className={inter.className}
                    >{`Signed in: ${ellipseAddress(activeAddress)}`}</p>
                )}

                {subscriptionResponse.value && (
                    <>
                        <p
                            className={inter.className}
                        >{`Owns subscription: ${subscriptionResponse.value.subID}`}</p>
                        <p className={inter.className}>{`Subscription type: ${
                            subscriptionResponse.value.subType === 0
                                ? "Unlimited"
                                : "Time Based"
                        }`}</p>
                    </>
                )}

                <div className={styles.grid}>
                    {!activeAddress && providers && (
                        <a
                            className={styles.card}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                                providers[0]
                                    .connect()
                                    .then(() => {
                                        setLoggedIn(true);
                                    })
                                    .catch(() => {
                                        setLoggedIn(false);
                                    });
                            }}
                        >
                            <h2 className={inter.className}>
                                Login <span>-&gt;</span>
                            </h2>
                            <p className={inter.className}>
                                Authenticate with PeraWallet provider
                            </p>
                        </a>
                    )}

                    {loading && (
                        <p className={inter.className}>
                            Loading! Please sign transactions...
                        </p>
                    )}

                    {!subscriptionResponse.value && activeAddress && (
                        <a
                            className={styles.card}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={async () => {
                                if (!loading) {
                                    setLoading(true);

                                    const response =
                                        await SubtopiaClient.subscribe(
                                            {
                                                subscriber: {
                                                    address: activeAddress,
                                                    signer: signer,
                                                },
                                                smiID: DUMMY_SMI_ID,
                                                expirationType:
                                                    SubscriptionExpirationType.MONTHLY,
                                            },
                                            { client: testNetAlgodClient }
                                        ).catch(() => {
                                            setLoading(false);
                                        });

                                    console.log(response);
                                    subscriptionResponse.retry();

                                    setLoading(false);
                                }
                            }}
                        >
                            <h2 className={inter.className}>
                                Purchase subscription <span>-&gt;</span>
                            </h2>
                            <p className={inter.className}>
                                Purchase dummy subtopia subscription
                            </p>
                        </a>
                    )}

                    {activeAddress && providers && (
                        <a
                            className={styles.card}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                                providers[0]
                                    ?.disconnect()
                                    .catch((err: { message: any }) =>
                                        console.error(err.message)
                                    );
                            }}
                        >
                            <h2 className={inter.className}>
                                Logout <span>-&gt;</span>
                            </h2>
                            <p className={inter.className}>
                                Logout from PeraWallet
                            </p>
                        </a>
                    )}
                </div>
            </main>
        </>
    );
}
