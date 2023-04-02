import styles from "./Demo.module.css";
import { useWallet, reconnectProviders } from "@txnlab/use-wallet";
import { useState, useEffect } from "react";
import { walletProviders } from "./providers";
import { SubtopiaClient } from "subtopia-js";
import algosdk from "algosdk";
import { useAsyncRetry } from "react-use";

export function ellipseAddress(address = ``, width = 6): string {
    return `${address.slice(0, width)}...${address.slice(-width)}`;
}

const testNetAlgodClient = new algosdk.Algodv2(
    ``,
    `https://testnet-api.algonode.cloud`,
    ``
);

const DUMMY_SMI_ID = 168195159;

export default function Home() {
    const { activeAddress, providers, signer } = useWallet();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, setLoggedIn] = useState<boolean>(false);
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
            <main
                className={styles.main}
                style={{
                    backgroundColor: "black",
                    color: "white",
                    fill: "white",
                }}
            >
                <div className={styles.center}>
                    <img
                        className={styles.logo}
                        src="https://ipfs.io/ipfs/bafybeietopj64xoicecmuruwcn7n2vijfgffrcv3ur4vw3qh477ezllchm"
                        alt="Next.js Logo"
                        width={300}
                        height={100}
                    />
                </div>
                {activeAddress && (
                    <p>{`Signed in: ${ellipseAddress(activeAddress)}`}</p>
                )}

                {subscriptionResponse.value && (
                    <>
                        <p>{`Owns subscription: ${subscriptionResponse.value.subID}`}</p>
                        <p>{`Subscription type: ${
                            subscriptionResponse.value.subType === 0
                                ? "Unlimited"
                                : "Time Based"
                        }`}</p>
                    </>
                )}

                <div className={styles.grid}>
                    {!activeAddress && providers && (
                        // eslint-disable-next-line jsx-a11y/anchor-is-valid
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
                            <h2>
                                Login <span>-&gt;</span>
                            </h2>
                            <p>Authenticate with PeraWallet provider</p>
                        </a>
                    )}

                    {loading && <p>Loading! Please sign transactions...</p>}

                    {!subscriptionResponse.value && activeAddress && (
                        // eslint-disable-next-line jsx-a11y/anchor-is-valid
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
                            <h2>
                                Purchase subscription <span>-&gt;</span>
                            </h2>
                            <p>Purchase dummy subtopia subscription</p>
                        </a>
                    )}

                    {activeAddress && providers && (
                        // eslint-disable-next-line jsx-a11y/anchor-is-valid
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
                            <h2>
                                Logout <span>-&gt;</span>
                            </h2>
                            <p>Logout from PeraWallet</p>
                        </a>
                    )}
                </div>
            </main>
        </>
    );
}
