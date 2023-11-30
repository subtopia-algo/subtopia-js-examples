<script lang="ts">
    import { onMount } from "svelte";
    import { PeraWalletConnect } from "@perawallet/connect";
    import {
        SubtopiaClient,
        Duration,
        type SubscriptionRecord,
    } from "subtopia-js-sdk";
    import algosdk, { Transaction } from "algosdk";
    import type {
        DecodedSignedTransaction,
        DecodedTransaction,
        PeraTransaction,
    } from "./types/node";
    import { SUBTOPIA_REGISTRY_ID, ChainType } from "subtopia-js-sdk";

    const peraWallet = new PeraWalletConnect();
    const dummySmiID = 487827764;
    const testNetAlgodClient = new algosdk.Algodv2(
        ``,
        `https://testnet-api.algonode.cloud`,
        ``
    );

    let accountAddress = "";
    let subtopiaClient: SubtopiaClient | null = null;
    let subscriptionBox: SubscriptionRecord | null = null;
    let loading = false;

    // Reactive statement to initialize subtopiaClient whenever accountAddress changes
    $: if (accountAddress) {
        (async () => {
            subtopiaClient = await SubtopiaClient.init({
                algodClient: testNetAlgodClient,
                chainType: ChainType.TESTNET,
                registryID: SUBTOPIA_REGISTRY_ID(ChainType.TESTNET),
                productID: dummySmiID,
                creator: {
                    addr: accountAddress,
                    signer: (
                        txnGroup: Transaction[],
                        indexesToSign: number[]
                    ) => {
                        const txnBlobs: Array<Uint8Array> = txnGroup.map(
                            algosdk.encodeUnsignedTransaction
                        );
                        return signTransactionsWithPera(
                            [accountAddress],
                            txnBlobs,
                            indexesToSign,
                            false
                        );
                    },
                },
            });

            await loadBoxStatus();
        })();
    }

    onMount(async () => {
        // Reconnect to the session when the component is mounted
        peraWallet
            .reconnectSession()
            .then(async (accounts) => {
                // Setup the disconnect event listener
                if (peraWallet.connector) {
                    peraWallet.connector.on(
                        "disconnect",
                        handleDisconnectWalletClick
                    );
                }

                if (accounts.length) {
                    setAccountAddress(accounts[0]);
                    await loadBoxStatus();
                }
            })
            .catch((e) => console.log(e));
    });

    function handleConnectWalletClick() {
        peraWallet
            .connect()
            .then((newAccounts) => {
                // Setup the disconnect event listener
                if (peraWallet.connector) {
                    peraWallet.connector.on(
                        "disconnect",
                        handleDisconnectWalletClick
                    );
                }
                setAccountAddress(newAccounts[0]);
                loadBoxStatus();
            })
            .catch((error) => {
                if (error.data && error.data.type !== "CONNECT_MODAL_CLOSED") {
                    console.log(error);
                }
            });
    }

    function handleDisconnectWalletClick() {
        peraWallet
            .disconnect()
            .then(() => {
                setAccountAddress(null);
                subscriptionBox = null;
            })
            .catch((error) => {
                console.log(error);
            });
    }

    async function loadBoxStatus() {
        if (!accountAddress) {
            return;
        }

        await subtopiaClient
            ?.getSubscription({
                algodClient: testNetAlgodClient,
                subscriberAddress: accountAddress,
            })
            .then((record: SubscriptionRecord) => {
                if (record) {
                    subscriptionBox = record;
                    console.log("Subscribed", subscriptionBox);
                } else {
                    console.log("Not subscribed");
                }
            });
    }

    async function signTransactionsWithPera(
        connectedAccounts: string[],
        transactions: Uint8Array[],
        indexesToSign?: number[],
        returnGroup = true
    ): Promise<Uint8Array[]> {
        const decodedTxns = transactions.map((txn) => {
            return algosdk.decodeObj(txn);
        }) as Array<DecodedTransaction | DecodedSignedTransaction>;

        const signedIndexes: number[] = [];

        const txnsToSign = decodedTxns.reduce<PeraTransaction[]>(
            (acc, txn, i) => {
                const isSigned = "txn" in txn;

                if (
                    indexesToSign &&
                    indexesToSign.length &&
                    indexesToSign.includes(i)
                ) {
                    signedIndexes.push(i);
                    acc.push({
                        txn: algosdk.decodeUnsignedTransaction(transactions[i]),
                    });
                } else if (
                    !isSigned &&
                    connectedAccounts.includes(
                        algosdk.encodeAddress(txn["snd"])
                    )
                ) {
                    signedIndexes.push(i);
                    acc.push({
                        txn: algosdk.decodeUnsignedTransaction(transactions[i]),
                    });
                } else if (isSigned) {
                    acc.push({
                        txn: algosdk.decodeSignedTransaction(transactions[i])
                            .txn,
                        signers: [],
                    });
                } else if (!isSigned) {
                    acc.push({
                        txn: algosdk.decodeUnsignedTransaction(transactions[i]),
                        signers: [],
                    });
                }

                return acc;
            },
            []
        );

        const result = await peraWallet.signTransaction([txnsToSign]);

        const signedTxns = transactions.reduce<Uint8Array[]>((acc, txn, i) => {
            if (signedIndexes.includes(i)) {
                const signedByUser = result.shift();
                signedByUser && acc.push(signedByUser);
            } else if (returnGroup) {
                acc.push(transactions[i]);
            }

            return acc;
        }, []);

        return signedTxns;
    }

    async function purchaseClick() {
        if (!loading) {
            loading = true;
        }

        await subtopiaClient
            ?.createSubscription({
                subscriber: {
                    addr: accountAddress as string,
                    signer: (
                        txnGroup: Transaction[],
                        indexesToSign: number[]
                    ) => {
                        const txnBlobs: Array<Uint8Array> = txnGroup.map(
                            algosdk.encodeUnsignedTransaction
                        );

                        return signTransactionsWithPera(
                            [accountAddress!],
                            txnBlobs,
                            indexesToSign,
                            false
                        );
                    },
                },
                duration: Duration.MONTH,
            })
            .then(async () => {
                await loadBoxStatus();
                loading = false;
            })
            .catch((e) => {
                console.log(e);
                loading = false;
            });
    }

    function setAccountAddress(address: string | null) {
        accountAddress = address ?? "";
    }
</script>

<main>
    Subtopia.js with PeraConnect with Svelte

    {#if accountAddress}
        <p>Account Address: {accountAddress}</p>
    {/if}

    {#if subscriptionBox}
        <p>Box ID: {subscriptionBox.subID}</p>
        <p>
            Box Type: {subscriptionBox.subType === 0
                ? "Unlimited"
                : "Time Based"}
        </p>
    {:else if !loading && !!accountAddress}
        <button on:click={purchaseClick}>Purchase</button>
    {:else if loading}
        <p>Loading...</p>
    {/if}
    <button
        on:click={!!accountAddress
            ? handleDisconnectWalletClick
            : handleConnectWalletClick}
    >
        {!!accountAddress ? "Disconnect" : "Connect to Pera Wallet"}
    </button>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
</style>
