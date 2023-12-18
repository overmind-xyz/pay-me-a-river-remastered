"use client";

import { WalletReadyState, useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { FaucetClient, Network } from "aptos";
import { ChevronDownIcon } from "@radix-ui/react-icons";

/* 
  Component that displays a button to connect a wallet. If the wallet is connected, it displays the 
  wallet's APT balance, address and a button to disconnect the wallet. 

  When the connect button is clicked, a dialog is displayed with a list of all supported wallets. If 
  a supported wallet is installed, the user can click the connect button to connect the wallet. If
  the wallet is not installed, the user can click the install button to install the wallet.
*/
export default function WalletSelector(props: { isTxnInProgress?: boolean }) {
  // wallet state variables
  const { connect, account, connected, disconnect, wallets, isLoading } = useWallet();
  // State to hold the current account's APT balance. In string - floating point format.
  const [balance, setBalance] = useState<string | undefined>(undefined);
  // State to hold whether the faucet is loading or not.
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);

  /* 
    Gets the balance of the connected account whenever the connected, account, isFaucetLoading,
    and isTxnInProgress variables change.

    Also checks if the account exists. If the account does not exist, it initializes the account
    by funding it with 1 APT. 
  */
  useEffect(() => {
    if (connected && account) {
      ensureAccountExists().then(() => {
        getBalance(account.address);
      });
    }
  }, [connected, account, props.isTxnInProgress, isFaucetLoading]);

  /* 
    Checks if the account exists. If the account does not exist, it initializes the account
    by funding it with 1 APT. 
  */
  const ensureAccountExists = async () => {

    const response = await fetch (
      `https://fullnode.testnet.aptoslabs.com/v1/accounts/${account.address}`,
      {
        method: 'GET'
      }
    );

    const accountData = await response.json();

    if (accountData.error_code == 'account_not_found') {
      initializeAccount();
    } else {
      return accountData
    }
  }

  /* 
    Initializes the account by funding it with 1 APT.
  */
  const initializeAccount = async () => {

    if (!connect || !account || props.isTxnInProgress || isFaucetLoading) {
      return;
    }

    setIsFaucetLoading(true)

    const faucetClient = new FaucetClient(Network.TESTNET, "https://faucet.testnet.aptoslabs.com");

    try {
      await faucetClient.fundAccount(account.address, 100000000, 1);
    } catch (e) {
      console.log(e);
    }

    setIsFaucetLoading(false)

  }

  /*
    Gets the balance of the given address. In case of an error, the balance is set to 0. The balance
    is returned in floating point format.
    @param address - The address to get the APT balance of.
  */
  const getBalance = async (address: string) => {

    const body = {
      function:
        "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [address],
    };
        
    let res;
    try {
      res = await fetch(
        `https://fullnode.testnet.aptoslabs.com/v1/view`,
        {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        }
      )
    } catch (e) {
      setBalance("0");
      return;
    }
    
    const data = await res.json();

    setBalance((data / 100000000).toLocaleString());

  };

  const handleConnect = (walletName: string) => {
    connect(walletName);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div>
      {!connected && !isLoading && (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-green-800 hover:bg-green-700 text-white font-matter font-medium px-3 space-x-2">
              <p>Connect Wallet</p>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect your wallet</DialogTitle>
              {
                wallets?.map((w:any) => {
                  return (
                    <div>
                      {
                        w?.readyState === "Installed"
                        ? (
                          <div
                            key={w.name}
                            className="flex w-full items-center justify-between rounded-xl p-2"
                          >
                            <h1>{w.name}</h1>
                            <Button variant="secondary" onClick={() => handleConnect(w.name)}>
                              Connect
                            </Button>
                          </div>
                        )
                        : (
                          <div
                            key={w.name}
                            className="flex w-full items-center justify-between rounded-xl p-2"
                          >
                            <h1>{w.name}</h1>
                            <a href={w.url} target="_blank">
                              <Button variant="secondary">
                                Install
                              </Button>
                            </a>
                          </div>
                        )
                      }
                    </div>
                  )
                }) || []
              }
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
      {
        isLoading && (
          <Button variant="secondary" disabled>
            Loading...
          </Button>
        )
      }
      {
        connected && account && (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="font-mono">
                  {balance} | {account.address.slice(0, 5)}...{account.address.slice(-4)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDisconnect()}>
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
    </div>
  );
}
