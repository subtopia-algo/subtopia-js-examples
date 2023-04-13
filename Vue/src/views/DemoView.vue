<template>
  <div class="demo">
    <div class="connected-wrapper" v-if="accountAddress">
      <div class="connected-label">Connected to {{ prettyAddress }}</div>
      <div v-if="subscription">
        <p>{{ `Owns subscription: ${subscription.subID}` }}</p>
        <p>{{ `Subscription type: ${subscriptionType}` }}</p>
      </div>
      <button
        v-if="!loading && !subscription && accountAddress"
        class="custom-button"
        @click="purchaseSubscription"
      >
        Purchase Subscription
      </button>
      <div class="connected-label" v-if="loading">Please, sign transactions...</div>

      <button class="custom-button" @click="disconnectWallet">Disconnect</button>
    </div>
    <button class="custom-button" @click="connectWallet" v-else>Connect to Pera Wallet</button>
  </div>
</template>

<script lang="ts">
import type { DecodedTransaction, DecodedSignedTransaction, PeraTransaction } from '@/types/node'
import { PeraWalletConnect } from '@perawallet/connect'
import algosdk, { Transaction } from 'algosdk'
import {
  SubtopiaClient,
  type SubscriptionRecord,
  SubscriptionType,
  SubscriptionExpirationType
} from 'subtopia-js'

const peraWallet = new PeraWalletConnect()
const dummySmiID = 190521162
const testNetAlgodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')

export default {
  name: 'App',
  data() {
    return {
      accountAddress: null as string | null,
      subscription: null as SubscriptionRecord | null,
      loading: false
    }
  },
  computed: {
    subscriptionType(): string | 'none' {
      return SubscriptionType[this.subscription!.subType] ?? 'none'
    },
    prettyAddress(): string {
      return this.accountAddress
        ? this.accountAddress.slice(0, 6) + '...' + this.accountAddress.slice(-6)
        : ''
    }
  },
  watch: {
    accountAddress: {
      handler() {
        this.fetchSubscriptionRecord()
      },
      immediate: true
    }
  },
  async created() {
    await this.initializePeraWallet()
  },
  methods: {
    async initializePeraWallet() {
      try {
        const accounts = await peraWallet.reconnectSession()
        peraWallet.connector!.on('disconnect', this.disconnectWallet)
        if (accounts.length) {
          this.accountAddress = accounts[0]
        }
      } catch (error) {
        if ((error as any)?.data?.type !== 'CONNECT_MODAL_CLOSED') {
          console.log(error)
        }
      }
    },
    connectWallet() {
      peraWallet
        .connect()
        .then((accounts) => {
          peraWallet.connector!.on('disconnect', this.disconnectWallet)
          this.accountAddress = accounts[0]
        })
        .catch((e) => console.log(e))
    },
    disconnectWallet() {
      peraWallet.disconnect().then(() => (this.accountAddress = null))
    },
    async purchaseSubscription() {
      if (!this.loading && this.accountAddress) {
        this.loading = true
        try {
          const response = await this.subscribeToSubtopia()
          console.log(response)
        } catch (error) {
          console.log(error)
        } finally {
          this.loading = false
          this.fetchSubscriptionRecord()
        }
      }
    },
    async fetchSubscriptionRecord() {
      if (this.accountAddress) {
        try {
          const res = await SubtopiaClient.getSubscriptionRecordForAccount(
            testNetAlgodClient,
            this.accountAddress,
            dummySmiID
          )
          this.subscription = res
        } catch (e) {
          console.log(e)
          this.subscription = null
        }
      } else {
        this.subscription = null
      }
      return this.subscription
    },
    async subscribeToSubtopia() {
      return await SubtopiaClient.subscribe(
        {
          subscriber: {
            address: this.accountAddress as string,
            signer: (txnGroup: Transaction[], indexesToSign: number[]) => {
              const txnBlobs: Array<Uint8Array> = txnGroup.map(algosdk.encodeUnsignedTransaction)

              return this.signTransactionsWithPera(
                [this.accountAddress!],
                txnBlobs,
                indexesToSign,
                false
              )
            }
          },
          smiID: dummySmiID,
          expirationType: SubscriptionExpirationType.MONTHLY
        },
        { client: testNetAlgodClient }
      )
    },
    async signTransactionsWithPera(
      connectedAccounts: string[],
      transactions: Uint8Array[],
      indexesToSign?: number[],
      returnGroup = true
    ): Promise<Uint8Array[]> {
      const decodedTxns = transactions.map((txn) => {
        return algosdk.decodeObj(txn)
      }) as Array<DecodedTransaction | DecodedSignedTransaction>

      const signedIndexes: number[] = []

      const txnsToSign = decodedTxns.reduce<PeraTransaction[]>((acc, txn, i) => {
        const isSigned = 'txn' in txn

        if (indexesToSign && indexesToSign.length && indexesToSign.includes(i)) {
          signedIndexes.push(i)
          acc.push({
            txn: algosdk.decodeUnsignedTransaction(transactions[i])
          })
        } else if (!isSigned && connectedAccounts.includes(algosdk.encodeAddress(txn['snd']))) {
          signedIndexes.push(i)
          acc.push({
            txn: algosdk.decodeUnsignedTransaction(transactions[i])
          })
        } else if (isSigned) {
          acc.push({
            txn: algosdk.decodeSignedTransaction(transactions[i]).txn,
            signers: []
          })
        } else if (!isSigned) {
          acc.push({
            txn: algosdk.decodeUnsignedTransaction(transactions[i]),
            signers: []
          })
        }

        return acc
      }, [])

      const result = await peraWallet.signTransaction([txnsToSign])

      const signedTxns = transactions.reduce<Uint8Array[]>((acc, txn, i) => {
        if (signedIndexes.includes(i)) {
          const signedByUser = result.shift()
          signedByUser && acc.push(signedByUser)
        } else if (returnGroup) {
          acc.push(transactions[i])
        }

        return acc
      }, [])

      return signedTxns
    }
  }
}
</script>

<style>
@media (min-width: 1024px) {
  .demo {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}
.connected-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}
.custom-button {
  background-color: #75daad;
  color: #000;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-top: 0.5rem;
}

.custom-button:hover {
  background-color: #86e2b8;
}
</style>
