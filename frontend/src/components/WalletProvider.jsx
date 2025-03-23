'use client';

import { WagmiConfig, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

const config = createConfig(
    getDefaultConfig({
        // Your dApp's info
        appName: 'zkSampler Verifier',
        // Alchemy API key is optional but recommended
        alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_ID || 'iZU16CnYnl9xt-za2mErOx1WT-u6io4l',
        // Just use Sepolia testnet
        chains: [sepolia],
    }),
);

export default function WalletProvider({ children }) {
    return (
        <WagmiConfig config={config}>
            <ConnectKitProvider theme="midnight">
                {children}
            </ConnectKitProvider>
        </WagmiConfig>
    );
}