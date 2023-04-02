import type { Transaction } from 'algosdk'

export interface PeraTransaction {
  txn: Transaction
  /**
   * Optional list of addresses that must sign the transactions.
   * Wallet skips to sign this txn if signers is empty array.
   * If undefined, wallet tries to sign it.
   */
  signers?: string[]
}

export type TxnType = 'pay' | 'keyreg' | 'acfg' | 'axfer' | 'afrz' | 'appl' | 'stpf'
export type DecodedTransaction = {
  amt: number
  fee: number
  fv: number
  gen: string
  gh: Uint8Array
  grp: Uint8Array
  lv: number
  note: Uint8Array
  rcv: Uint8Array
  snd: Uint8Array
  type: TxnType
}

export type DecodedSignedTransaction = {
  sig: Uint8Array
  txn: DecodedTransaction
}
