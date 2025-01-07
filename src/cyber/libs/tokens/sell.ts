import {
	CONNECTION,
	WRAPPED_SOL,
	jupiterApiClient,
} from "./utils";
import {
	PublicKey,
} from "@solana/web3.js";
import { QuoteGetRequest } from "@jup-ag/api";

export async function sell(
	{
		mintAddress,
		userAddress,
		amount,
		slippage,
		priorityFee,
		delegate,
	}: {
		mintAddress: string;
		userAddress: string;
		amount: number;
		slippage: number;
		priorityFee: number;
		delegate: boolean;
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
		
		// const bc = await pumpfunSDK.getBondingCurveAccount(
		// 	new PublicKey(mintAddress)
		// );

		// if (bc.complete) {
		// 	return await getCompleteBoundingCurveSwapTransaction({
		// 		from: mintAddress,
		// 		to: "So11111111111111111111111111111111111111112",
		// 		userAddress,
		// 		amount: amount * 10 ** 6,
		// 		slippage,
		// 		// priorityFee,
		// 		delegate,
		// 	});
		// }

		// let globalAccount = await pumpfunSDK.getGlobalAccount("confirmed");

		// const minSolOutput = bc.getSellPrice(
		// 	BigInt(amount * 10 ** 6),
		// 	globalAccount.feeBasisPoints
		// );

		// let sellAmountWithSlippage =
		// 	Number(minSolOutput) - Number(minSolOutput) * (slippage / 100);

		// return await getBoundingCurveSwapTransaction({
		// 	priorityFee,
		// 	mintAddress,
		// 	userAddress,
		// 	amount: amount * 10 ** 6,
		// 	maxAmountLamports: BigInt(Math.floor(sellAmountWithSlippage)),
		// 	delegate,
		// 	type: "sell",
		// });

		// Get token's decimal places
		const mintInfo = await CONNECTION.getParsedAccountInfo(new PublicKey(mintAddress));
		const decimals = mintInfo.value?.data['parsed']['info']['decimals'];

		const nativeAmount = amount * Math.pow(10, decimals);

		console.log('nativeAmount', nativeAmount)

		const quoteParams: QuoteGetRequest = {
            inputMint: mintAddress, 
            outputMint: WRAPPED_SOL,
            amount: nativeAmount,
            slippageBps: slippage * 100
        };

		// Get quote for selling
        const quote = await jupiterApiClient.quoteGet(quoteParams);

        if (!quote) {
            throw new Error("Unable to get sell quote");
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

		// Deserialize the transaction
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
