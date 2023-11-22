import styles from "./Demo.module.css";
import { useWallet } from "@txnlab/use-wallet";
import { useState, useEffect } from "react";
import {
    ChainType,
    Duration,
    SUBTOPIA_REGISTRY_ID,
    SubtopiaClient,
} from "subtopia-js";
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

const DUMMY_SMI_ID = 481312144;

export default function Home() {
    const { activeAddress, providers, signer } = useWallet();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, setLoggedIn] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [subtopiaClient, setSubtopiaClient] =
        useState<SubtopiaClient | null>();

    const subscriptionResponse = useAsyncRetry(async () => {
        if (!activeAddress || !subtopiaClient) {
            return undefined;
        }

        return await subtopiaClient.getSubscription({
            algodClient: testNetAlgodClient,
            subscriberAddress: activeAddress,
        });
    }, [activeAddress]);

    useEffect(() => {
        // async method to init and set subtopia
        const initSubtopiaClient = async () => {
            if (!activeAddress || !signer) {
                return;
            }

            const client = await SubtopiaClient.init({
                algodClient: testNetAlgodClient,
                productID: DUMMY_SMI_ID,
                registryID: SUBTOPIA_REGISTRY_ID(ChainType.TESTNET),
                creator: {
                    addr: activeAddress,
                    signer: signer,
                },
            });

            setSubtopiaClient(client);
            subscriptionResponse.retry();
        };

        if (!subtopiaClient) {
            initSubtopiaClient();
        }
    });

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

                    {!subscriptionResponse.value &&
                        subtopiaClient &&
                        activeAddress && (
                            // eslint-disable-next-line jsx-a11y/anchor-is-valid
                            <a
                                className={styles.card}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={async () => {
                                    if (!loading) {
                                        setLoading(true);

                                        await subtopiaClient
                                            .createSubscription({
                                                subscriber: {
                                                    addr: activeAddress,
                                                    signer: signer,
                                                },
                                                duration: Duration.MONTH,
                                            })
                                            .catch(() => {
                                                setLoading(false);
                                            });

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
