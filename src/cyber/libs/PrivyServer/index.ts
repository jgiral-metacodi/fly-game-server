import type { PrivyClient } from "@privy-io/server-auth";
import { privyClient } from "../tokens/utils";

export interface EthSignMessageParams {
  walletId: string;
  message: string;
}

export interface SignMessageResponse {
  signature: string;
  encoding: string;
}

export interface TypedDataDomain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
  salt?: string;
}

export interface TypedDataType {
  name: string;
  type: string;
}

export interface TypedData {
  domain: TypedDataDomain;
  types: Record<string, TypedDataType[]>;
  primaryType: string;
  message: Record<string, any>;
}

export interface EthSignTypedDataParams {
  walletId: string;
  typedData: TypedData;
}

export interface SignTypedDataResponse {
  signature: string;
  encoding: string;
}

export interface EthTransactionRequest {
  to: string;
  value: number;
  chainId: number;
  data?: string;
  nonce?: number;
  gasLimit?: number;
  gasPrice?: number;
  maxFeePerGas?: number;
  maxPriorityFeePerGas?: number;
}

export interface EthSignTransactionParams {
  walletId: string;
  transaction: EthTransactionRequest;
}

export interface EthSignTransactionResponse {
  signedTransaction: string;
  encoding: string;
}

export interface EthSendTransactionParams {
  walletId: string;
  caip2: string; // Chain identifier in format "eip155:<chainId>"
  transaction: EthTransactionRequest;
}

export interface SendTransactionResponse {
  hash: string;
}

export interface SolSignMessageParams {
  walletId: string;
  message: string;
}

export interface SolSignTransactionParams {
  walletId: string;
  transaction: any; // Transaction | VersionedTransaction from @solana/web3.js
}

export interface SolSignTransactionResponse {
  signedTransaction: any; // The signed transaction object
}

export interface SolSignAndSendTransactionParams {
  walletId: string;
  caip2: string; // Chain identifier in format "solana:<cluster>"
  transaction: any; // Transaction | VersionedTransaction from @solana/web3.js
}

/**
 * PrivyServer - A wrapper around @privy-io/server-auth's wallet methods for Ethereum and Solana
 */
export class PrivyServer {
  #client: PrivyClient;

  constructor() {
    this.#client = privyClient;
  }

  /**
   * Sign a message with an Ethereum wallet
   *
   * @param params - Parameters for signing a message
   * @returns The signature and encoding
   *
   * @example
   * ```typescript
   * const { signature, encoding } = await privyDelegate.signEthMessage({
   *   walletId: 'your-wallet-id',
   *   message: 'Hello world',
   * });
   * ```
   */
  async signEthMessage(
    params: EthSignMessageParams
  ): Promise<SignMessageResponse> {
    const { walletId, message } = params;

    const response = await this.#client.walletApi.rpc({
      walletId,
      method: "personal_sign",
      params: {
        message,
        encoding: "utf-8",
      },
      chainType: "ethereum",
    });

    // Cast response to any to safely extract data
    const responseData = response as any;

    return {
      signature: String(responseData?.signature || ""),
      encoding: "utf-8",
    };
  }

  /**
   * Sign typed data with an Ethereum wallet (EIP-712)
   *
   * @param params - Parameters for signing typed data
   * @returns The signature and encoding
   *
   * @example
   * ```typescript
   * const { signature, encoding } = await privyDelegate.signEthTypedData({
   *   walletId: 'your-wallet-id',
   *   typedData: {
   *     domain: {
   *       name: 'Ether Mail',
   *       version: '1',
   *       chainId: 1,
   *       verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
   *     },
   *     types: {
   *       Person: [
   *         { name: 'name', type: 'string' },
   *         { name: 'wallet', type: 'address' },
   *       ],
   *       Mail: [
   *         { name: 'from', type: 'Person' },
   *         { name: 'to', type: 'Person' },
   *         { name: 'contents', type: 'string' },
   *       ],
   *     },
   *     primaryType: 'Mail',
   *     message: {
   *       from: {
   *         name: 'Cow',
   *         wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
   *       },
   *       to: {
   *         name: 'Bob',
   *         wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
   *       },
   *       contents: 'Hello, Bob!',
   *     },
   *   },
   * });
   * ```
   */
  async signEthTypedData(
    params: EthSignTypedDataParams
  ): Promise<SignTypedDataResponse> {
    const { walletId, typedData } = params;

    const response = await this.#client.walletApi.rpc({
      walletId,
      method: "eth_signTypedData_v4",
      params: {
        typedData,
      },
      chainType: "ethereum",
    });

    // Cast response to any to safely extract data
    const responseData = response as any;

    return {
      signature: String(responseData?.signature || ""),
      encoding: "utf-8",
    };
  }

  /**
   * Sign a transaction with an Ethereum wallet without broadcasting it
   *
   * @param params - Parameters for signing a transaction
   * @returns The signed transaction and encoding
   *
   * @example
   * ```typescript
   * const { signedTransaction, encoding } = await privyDelegate.signEthTransaction({
   *   walletId: 'your-wallet-id',
   *   transaction: {
   *     to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
   *     value: 100000,
   *     chainId: 8453,
   *   },
   * });
   * ```
   */
  async signEthTransaction(
    params: EthSignTransactionParams
  ): Promise<EthSignTransactionResponse> {
    const { walletId, transaction } = params;

    const response = await this.#client.walletApi.rpc({
      walletId,
      method: "eth_signTransaction",
      params: {
        transaction,
      },
      chainType: "ethereum",
    });

    // Cast response to any to safely extract data
    const responseData = response as any;

    return {
      signedTransaction: String(responseData?.signedTransaction || ""),
      encoding: "utf-8",
    };
  }

  /**
   * Sign and send a transaction with an Ethereum wallet
   *
   * @param params - Parameters for sending a transaction
   * @returns The transaction hash
   *
   * @example
   * ```typescript
   * const { hash } = await privyDelegate.sendEthTransaction({
   *   walletId: 'your-wallet-id',
   *   caip2: 'eip155:8453',
   *   transaction: {
   *     to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
   *     value: 100000,
   *     chainId: 8453,
   *   },
   * });
   * ```
   */
  async sendEthTransaction(
    params: EthSendTransactionParams
  ): Promise<SendTransactionResponse> {
    const { walletId, caip2, transaction } = params;

    const response = await this.#client.walletApi.rpc({
      walletId,
      method: "eth_sendTransaction",
      params: {
        transaction,
      },
      chainType: "ethereum",
      caip2,
    });

    // Cast response to any to safely extract data
    const responseData = response as any;

    return {
      hash: String(responseData?.hash || responseData?.txHash || ""),
    };
  }

  /**
   * Sign a message with a Solana wallet
   *
   * @param params - Parameters for signing a message
   * @returns The signature and encoding
   *
   * @example
   * ```typescript
   * const { signature, encoding } = await privyDelegate.signSolMessage({
   *   walletId: 'your-wallet-id',
   *   message: 'Hello world',
   * });
   * ```
   */
  async signSolMessage(
    params: SolSignMessageParams
  ): Promise<SignMessageResponse> {
    const { walletId, message } = params;

    const response = await this.#client.walletApi.rpc({
      walletId,
      method: "signMessage",
      params: {
        message,
        encoding: "utf-8",
      },
      chainType: "solana",
    });

    // Cast response to any to safely extract data
    const responseData = response as any;

    return {
      signature: String(responseData?.signature || ""),
      encoding: "utf-8",
    };
  }

  /**
   * Sign a transaction with a Solana wallet without broadcasting it
   *
   * @param params - Parameters for signing a transaction
   * @returns The signed transaction object
   *
   * @example
   * ```typescript
   * const { signedTransaction } = await privyDelegate.signSolTransaction({
   *   walletId: 'your-wallet-id',
   *   transaction: solanaTransaction, // Transaction | VersionedTransaction from @solana/web3.js
   * });
   * ```
   */
  async signSolTransaction(
    params: SolSignTransactionParams
  ): Promise<SolSignTransactionResponse> {
    const { walletId, transaction } = params;

    const response = await this.#client.walletApi.rpc({
      walletId,
      method: "signTransaction",
      params: {
        transaction,
      },
      chainType: "solana",
    });

    // Cast response to any to safely extract data
    const responseData = response as any;

    return {
      signedTransaction: responseData?.signedTransaction || null,
    };
  }

  /**
   * Sign and send a transaction with a Solana wallet
   *
   * @param params - Parameters for signing and sending a transaction
   * @returns The transaction hash
   *
   * @example
   * ```typescript
   * const { hash } = await privyDelegate.signAndSendSolTransaction({
   *   walletId: 'your-wallet-id',
   *   caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Mainnet
   *   transaction: solanaTransaction, // Transaction | VersionedTransaction from @solana/web3.js
   * });
   * ```
   */
  async signAndSendSolTransaction(
    params: SolSignAndSendTransactionParams
  ): Promise<SendTransactionResponse> {
    const { walletId, caip2, transaction } = params;

    const response = await this.#client.walletApi.rpc({
      walletId,
      method: "signAndSendTransaction",
      params: {
        transaction,
      },
      chainType: "solana",
      caip2,
    });

    // Cast response to any to safely extract data
    const responseData = response as any;

    return {
      hash: String(
        responseData?.hash ||
          responseData?.txHash ||
          responseData?.signature ||
          ""
      ),
    };
  }
}
