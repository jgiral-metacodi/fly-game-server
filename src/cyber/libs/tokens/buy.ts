import { LAMPORTS_PER_SOL, VersionedTransaction } from "@solana/web3.js";
import { jupiterApiClient, WRAPPED_SOL } from "./utils";
import { QuoteGetRequest } from "@jup-ag/api";


// handler
export async function buy(
	{
		delegate,
		mintAddress,
		amount,
		slippage,
		priorityFee,
		userAddress,
	}: {
		delegate: boolean;
		mintAddress: string;
		amount: number;
		slippage: number;
		priorityFee: number;
		userAddress: string;
	} = {
		amount: 0.001,
		delegate: false,
		slippage: 25,
		priorityFee: 1000000,
		userAddress: "",
		mintAddress: "",
	}
) {
	//
	try {

		// const amount_lamports = amount * LAMPORTS_PER_SOL;

		// const bc = await pumpfunSDK.getBondingCurveAccount(
		// 	new PublicKey(mintAddress)
		// );

		// if (bc.complete) {
		// 	return await getCompleteBoundingCurveSwapTransaction({
		// 		from: "So11111111111111111111111111111111111111112",
		// 		to: mintAddress,
		// 		userAddress,
		// 		amount: amount_lamports,
		// 		slippage,
		// 		// priorityFee,
		// 		delegate,
		// 	});
		// }

		// const buyAmount = bc.getBuyPrice(BigInt(amount * LAMPORTS_PER_SOL));

		// const maxAmountLamports = Math.floor(
		// 	amount_lamports * (1 + slippage / 100)
		// );

		// return await getBoundingCurveSwapTransaction({
		// 	priorityFee,
		// 	mintAddress,
		// 	userAddress,
		// 	amount: buyAmount,
		// 	maxAmountLamports,
		// 	delegate,
		// });
	
		const quoteParams: QuoteGetRequest = {
            inputMint: WRAPPED_SOL, // Wrapped SOL
            outputMint: mintAddress,
            amount: (amount * LAMPORTS_PER_SOL),
            slippageBps: slippage * 100 
        };

		const quote = await jupiterApiClient.quoteGet(quoteParams);
		
		if (!quote) {
			throw new Error("Unable to get quote");
		}

        const swapObj = await jupiterApiClient.swapPost({
            swapRequest: {
                quoteResponse: quote,
                userPublicKey: userAddress,
                dynamicComputeUnitLimit: true,
                dynamicSlippage: {
                    maxBps: 300, // Cap at 3% for safety
                },
                prioritizationFeeLamports: priorityFee > 0 ? {
                    priorityLevelWithMaxLamports: {
                        maxLamports: priorityFee,
                        priorityLevel: "veryHigh"
                    }
                } : undefined
            }
        });

		const swapTransactionBuf = Buffer.from(swapObj.swapTransaction, "base64");
		const tx = swapTransactionBuf.toString("base64");

		console.log('tx', tx)

		return {
			success: true,
			tx,
		};
	} catch (error) {
		console.error(error);
		return { error: error.message, success: false };
	}
}
