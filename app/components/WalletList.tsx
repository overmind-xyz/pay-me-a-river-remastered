import React from 'react'
import { Button } from '@/components/ui/button'
import { WalletReadyState } from '@aptos-labs/wallet-adapter-react'
import { WalletName } from '@aptos-labs/wallet-adapter-core';

interface WalletListProps {
  wallet: any;
  connect: (walletName: WalletName) => void;
}


export const WalletList: React.FC<WalletListProps> = ({ wallet, connect
}) => {
  if (wallet.readyState === WalletReadyState.Installed) {
    return (
        <div
        key={wallet.name}
        className="flex w-full items-center justify-between rounded-xl p-2"
        >
        <h1>{wallet.name}</h1>
        <Button variant="secondary" onClick={() => connect(wallet.name)}>
          Connect
        </Button>
        </div>

    );
  }
  return (
      <div
        key={wallet.name}
        className="flex w-full items-center justify-between rounded-xl p-2"
      >
        <h1>{wallet.name}</h1>
        <a href={wallet.url} target="_blank">
          <Button variant="secondary">
            Install
          </Button>
        </a>
      </div>
    )
}
