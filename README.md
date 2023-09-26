# Pay me a River - Remastered

This is the starter template for Overmind's Pay me a River - Remastered FE quest. The original Pay me a River quest can be view [here](https://overmind.xyz/quests/pay-me-a-river). 

# Table of Contents
- [Pay me a River - Remastered](#pay-me-a-river---remastered)
- [Table of Contents](#table-of-contents)
- [Tech Stack](#tech-stack)
- [Developer Cheat Sheet](#developer-cheat-sheet)
  - [Pay me a River module](#pay-me-a-river-module)
    - [Module details](#module-details)
    - [Module deployment details](#module-deployment-details)
  - [React and Next.js](#react-and-nextjs)
    - [Conditional rendering](#conditional-rendering)
    - [Rendering lists](#rendering-lists)
  - [Wallet adapter](#wallet-adapter)
    - [Initializing the wallet adapter](#initializing-the-wallet-adapter)
    - [useWallet hook](#usewallet-hook)
    - [Connecting and disconnecting from the wallet](#connecting-and-disconnecting-from-the-wallet)
    - [Signing and submitting transactions](#signing-and-submitting-transactions)
    - [Account information](#account-information)
    - [Network information](#network-information)
    - [Wallet information](#wallet-information)
    - [Wallets information](#wallets-information)
  - [Aptos API](#aptos-api)
    - [Calling view functions](#calling-view-functions)
    - [Retrieve account data](#retrieve-account-data)
    - [Querying events](#querying-events)
  - [Aptos TS SDK](#aptos-ts-sdk)
    - [Initializing and funding accounts](#initializing-and-funding-accounts)
  - [Aptos explorer](#aptos-explorer)
    - [Transaction link](#transaction-link)
    - [Account link](#account-link)
- [Quest](#quest)
  - [Deploying the dapp locally](#deploying-the-dapp-locally)
  - [Completing the quest](#completing-the-quest)

# Tech Stack
- [Yarn](https://yarnpkg.com/) package manager
- [React](https://react.dev/) library for building user interfaces
- [Next.js](https://nextjs.org/) framework for React
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [shadcn/ui](https://ui.shadcn.com/) for UI components using Radix UI and Tailwind CSS
- [Aptos wallet adapter](https://github.com/aptos-labs/aptos-wallet-adapter/tree/main/packages/wallet-adapter-react), [Aptos TS SDK](https://aptos.dev/sdks/ts-sdk/index/), and [Aptos API](https://aptos.dev/nodes/aptos-api-spec/#/) for interacting with the Aptos blockchain

# Developer Cheat Sheet

## Pay me a River module
This FE quest is built on top of the Pay me a River smart contract quest. The Pay me a River module is a smart contract that allows users to stream APT to others via a real-time payment. This real-time payment holds APT which is streamed to the recipient. The recipient can claim the streamed APT at anytime. The module code can be viewed [here](./contracts/sources/pay_me_a_river.move).

### Module details
The Pay me a River module has the following entry functions: 
  - `create_stream`: Allows a user to create a new payment stream. The user must provide the following arguments: 
    - `receiver_address`: The address of the recipient of the payment stream
    - `amount`: The amount of APT to be streamed to the recipient
    - `duration_in_seconds`: The duration of the payment stream in seconds
  - `accept_stream`: Allows the recipient to accept a pending payment stream. The user must provide the following arguments: 
    - `sender_address`: The address of the sender of the payment stream to be accepted
  - `claim_stream`: Allows the recipient to claim all of the APT that has been streamed so far. This will close the stream if the stream is completed. The user must provide the following arguments: 
    - `sender_address`: The address of the sender of the payment stream to be claimed
  - `cancel_stream`: Allows the sender or recipient of the payment stream to cancel the stream. The user must provide the following arguments: 
    - `sender_address`: The address of the sender of the payment stream to be cancelled
    - `receiver_address`: The address of the recipient of the payment stream to be cancelled

The Pay me a River module has the following view functions:
  - `get_receivers_streams`: Returns a list of all payment streams that the user is the recipient of. The user must provide the following arguments: 
    - `receiver_address`: The address of the recipient of the payment streams
  - `get_senders_streams`: Returns a list of all payment streams that the user is the sender of. The user must provide the following arguments: 
    - `sender_address`: The address of the sender of the payment streams]
  
The Pay me a River module has the following events (stored in the `ModuleEventStore` resource): 
  - `stream_create_events`: Emitted when a new payment stream is created. The event contains the following data: 
    - `sender_address`: The address of the sender of the payment stream
    - `receiver_address`: The address of the recipient of the payment stream
    - `amount`: The amount of APT to be streamed to the recipient
    - `duration_in_seconds`: The duration of the payment stream in seconds
    - `stream_id`: The unique id of the payment stream
    - `timestamp`: The timestamp when the payment stream was created
  - `stream_accept_events`: Emitted when a payment stream is accepted. The event contains the following data: 
    - `sender_address`: The address of the sender of the payment stream
    - `receiver_address`: The address of the recipient of the payment stream
    - `stream_id`: The unique id of the payment stream
    - `timestamp`: The timestamp when the payment stream was created
  - `stream_claim_events`: Emitted when a payment stream is claimed. The event contains the following data: 
    - `sender_address`: The address of the sender of the payment stream
    - `receiver_address`: The address of the recipient of the payment stream
    - `amount`: The amount of APT that was claimed
    - `stream_id`: The unique id of the payment stream
    - `timestamp`: The timestamp when the payment stream was created
  - `stream_close_events`: Emitted when a payment stream is closed. The event contains the following data: 
    - `sender_address`: The address of the sender of the payment stream
    - `receiver_address`: The address of the recipient of the payment stream
    - `amount_to_receiver`: The amount of APT sent to the recipient
    - `amount_to_sender`: The amount of APT refunded to the sender
    - `stream_id`: The unique id of the payment stream
    - `timestamp`: The timestamp when the payment stream was created

### Module deployment details
This dapp interacts with a deployed `pay_me_a_river` instance on Aptos Testnet. The deployed module has the following properties: 
- module address: `0x70a6f54475da6bdb55b5d938249a7d496797c7515a3d24aa2fa778c0a8d7a36f`
- module name: `pay_me_a_river`

In this contract, the admin/module deployer is used to store all of the module's resources instead of a resource account. Because of this the resource account constant is the same as the module address: `0x70a6f54475da6bdb55b5d938249a7d496797c7515a3d24aa2fa778c0a8d7a36f`

These properties are set up in the [`next.config.js`](./app/next.config.js) and can be used in the tsx file with: 
- module address: `process.env.MODULE_ADDRESS`
- module name: `process.env.MODULE_NAME`
- module's resource account address: `process.env.RESOURCE_ACCOUNT_ADDRESS`

The deployed module can be viewed [here](https://explorer.aptoslabs.com/account/0x70a6f54475da6bdb55b5d938249a7d496797c7515a3d24aa2fa778c0a8d7a36f/modules/code/pay_me_a_river?network=testnet). 

## React and Next.js
This dapp is built using React and Next.js. React is a JavaScript library for building user interfaces. Next.js is a React framework that provides a number of features including server-side rendering, file-based routing, and automatic code splitting.

### Conditional rendering
This dapp uses conditional rendering to display different components based on the state of the dapp. The following examples show how conditional rendering is used in this dapp.

The following code snippet shows how conditional rendering is used to display a loading message while the wallet is loading: 
```tsx
// Get the isLoading property from the wallet adapter (boolean indicating if the wallet is loading)
const { isLoading } = useWallet();

// Conditional rendering to display a loading message
<>
  {
    isLoading && 
    (
      <div>
        <h1>Loading...</h1>
      </div>
    )
  }
</>
```

The following code snippet shows how conditional rendering is used with the ternary operator to display a message based on the connected state of the wallet: 
```tsx
// Get the connected property from the wallet adapter (boolean indicating if the wallet is connected)
const { connected } = useWallet();

// Conditional rendering to display a message based on the connected state
<>
  {
    connected ? 
    (
      <div>
        <h1>Connected</h1>
      </div>
    ) : 
    (
      <div>
        <h1>Not connected</h1>
      </div>
    )
  }
</>
```

### Rendering lists
There are times when a list of data needs to be rendered. If the list is static, the list can be hard-coded in the tsx file. If the list is dynamic, the list can be stored in a state variable and rendered using the `map` function. This is called dynamic rendering and is used in this dapp.

This dapp uses the `map` function to render lists of data. The following examples show how the `map` function is used in this dapp.

The following code snippet shows how the `map` function is used to render a list of wallets: 
```tsx
// Get the wallets property from the wallet adapter
const { wallets } = useWallet();

/* 
  Iterates through each wallets and returns a div with the wallet name. The index is used as the key 
  to ensure that each div is unique.
*/
<>
  <h1>Wallets</h1>
  {
    wallets.map((wallet, index) => {
      return (
        <div key={index}>
          <h2>{wallet.name}</h2>
        </div>
      )
    })
  }
</>
```

## Wallet adapter
The Aptos wallet adapter contains the logic for connecting to the Aptos wallet and submitting transactions. 


### Initializing the wallet adapter

The wallet adapter provider is initialized in the [`app/layout.tsx`](./app/app/layout.tsx) file. 

### useWallet hook

All wallet properties and functions are provided with the `useWallet` hook. The hook must be imported from the wallet adapter package: 
```tsx
import { useWallet } from '@aptos-labs/aptos-wallet-adapter-react';
```
Once the hook is imported, you can use the provide properties and functions: 
```tsx
const {
  connect,    // connect to the wallet
  account,    // connected wallet's account information
  network,    // connected wallet's network
  connected,  // boolean indicating if the wallet is connected
  disconnect, // disconnect from the wallet
  isLoading,  // boolean indicating if the wallet is loading
  wallet,     // connected wallet information
  wallets,    // list of information for all supported wallets
  signAndSubmitTransaction,     // sign and submit a transaction
  signAndSubmitBCSTransaction,  // sign and submit a BCS transaction
  signTransaction,              // sign a transaction
  signMessage,                  // sign a message
  signMessageAndVerify,         // sign a message and verify
} = useWallet();
```

### Connecting and disconnecting from the wallet
To connect to a wallet, use the `connect` function provided by the `useWallet` hook as follows: 
```tsx
// Get the connect function from the wallet adapter
const { connect } = useWallet();

// Function to connect to a wallet
const handleConnect = (walletName: string) => {
  connect(walletName);
};

// Wallet selector component for a single wallet
<div>
  <h1>{wallet.name}</h1>
  <Button 
    variant="secondary" 
    onClick={() => handleConnect(wallet.name)}
  >
    Connect
  </Button>
</div>
```

Similarly, to disconnect from the wallet, use the `disconnect` function provided by the `useWallet` hook as follows: 
```tsx
// Get the disconnect function from the wallet adapter
const { disconnect } = useWallet();

// Function to disconnect from the wallet
const handleDisconnect = () => {
  disconnect();
};

// Disconnect button
<Button onClick={() => handleDisconnect()}>
  Disconnect
</Button>
```

### Signing and submitting transactions

To sign and submit a transaction, use the `signAndSubmitTransaction` function provided by the `useWallet` hook as follows: 
```tsx
/*
  Function to sign and submit a transaction. In this case, the transaction is a call to transfer 10 
  APT to the address 0xabc123. 

  Note: The Types.TransactionPayload type is imported from the Aptos TS SDK. This is the only use of
        the TS SDK in this dapp.

  Note: The signer argument is provided by the wallet adapter internally. There is no need to 
        provide this argument.
*/
const handleSignAndSubmitTransaction = async () => {
  // Transaction payload
  const payload: Types.TransactionPayload = {
    type: "entry_function_payload", // The type of transaction payload
    function: `0x1::coin::transfer`, // The address::module::function to call
    type_arguments: ['0x1::aptos_coin::AptosCoin'],
    arguments: [
      '0xabc123', // recipient address
      1000000000, // 10 APT
    ],
  };
  
  /*
    Sign and submit the transaction in a try/catch block

    NOTE: The sleep helper function to ensure that the transaction is reliably viewable on the 
          blockchain. The minimum amount of seconds to wait to get reliable results is stored in the 
          environment under `TRANSACTION_DELAY_MILLISECONDS`. Even though the Aptos TS SDK has a 
          helper function, waitForTransaction, we have found it more reliable to use the sleep 
          function.
  */
  try {
    const result = await signAndSubmitTransaction(payload);
    await sleep(parseInt(process.env.TRANSACTION_DELAY_MILLISECONDS || '0'))
    console.log(result);
  } catch (e) {
    console.log(e);
  }

};

// Sign and submit transaction button
<Button onClick={() => handleSignAndSubmitTransaction()}>
  Transfer 10 APT to 0xabc123
</Button>
```

### Account information

The `account` property provided by the `useWallet` hook contains the following information: 
```tsx
declare type AccountInfo = {
  address: string;
  publicKey: string | string[];
  minKeysRequired?: number;
  ansName?: string | null;
};

// Div to display account address
<div>
  <h1>Address: {account.address}</h1>
</div>
```

### Network information

The `network` property provided by the `useWallet` hook contains the following information: 
```tsx
declare type NetworkInfo = {
  name: NetworkName;
  chainId?: string;
  url?: string;
};

enum NetworkName {
  Mainnet = "mainnet",
  Testnet = "testnet",
  Devnet = "devnet"
}

// Example conditional rendering based on network
<>
  {
    network.name.toString() !== 'Testnet' && 
    (
      <div>
        <h1>Warning! You are on the wrong network. Please switch to Testnet.</h1>
      </div>
    )
  }
</>
```

### Wallet information

The `wallet` property provided by the `useWallet` hook contains the following information: 
```tsx
declare type WalletInfo = {
  name: WalletName; // name of the wallet as a string
  icon: string;
  url: string;
};

// Div to display wallet name
<div>
  <h1>Wallet: {wallet.name}</h1>
</div>
```

### Wallets information

The `wallets` property provided by the `useWallet` hook contains the following information: 
```tsx
declare type Wallet<Name extends string = string> = AdapterPlugin<Name> & {
  readyState?: WalletReadyState;
};

declare type AdapterPlugin<Name extends string = string> = AdapterPluginProps<Name> & AdapterPluginEvents;

interface AdapterPluginProps<Name extends string = string> {
  name: WalletName<Name>;
  url: string;
  icon: `data:image/${"svg+xml" | "webp" | "png" | "gif"};base64,${string}`;
  providerName?: string;
  provider: any;
  deeplinkProvider?: (data: {
      url: string;
  }) => string;
  connect(): Promise<any>;
  disconnect: () => Promise<any>;
  network: () => Promise<any>;
  signAndSubmitTransaction<T extends Types.TransactionPayload, V>(transaction: T, options?: V): Promise<{
      hash: Types.HexEncodedBytes;
  }>;
  signMessage<T extends SignMessagePayload>(message: T): Promise<SignMessageResponse>;
}

interface AdapterPluginEvents {
  onNetworkChange: OnNetworkChange;
  onAccountChange(callback: any): Promise<any>;
}

declare enum WalletReadyState {
  /**
   * User-installable wallets can typically be detected by scanning for an API
   * that they've injected into the global context. If such an API is present,
   * we consider the wallet to have been installed.
   */
  Installed = "Installed",
  NotDetected = "NotDetected",
  /**
   * Loadable wallets are always available to you. Since you can load them at
   * any time, it's meaningless to say that they have been detected.
   */
  Loadable = "Loadable",
  /**
   * If a wallet is not supported on a given platform (eg. server-rendering, or
   * mobile) then it will stay in the `Unsupported` state.
   */
  Unsupported = "Unsupported"
}

/* 
  div to display all wallets and provide a connect or install button based on the wallet's ready 
  state
*/
<>
  {
    wallets.map((wallet, index) => (
      <div key={index}>
        <h1>{wallet.name}</h1>
        {
          wallet.readyState === WalletReadyState.Installed && 
          (
            <Button 
              variant="secondary" 
              onClick={() => handleConnect(wallet.name)}
            >
              Connect
            </Button>
          )
        }
        {
          wallet.readyState === WalletReadyState.NotDetected && 
          (
            <a href={wallet.url} target="_blank">
              <Button 
                variant="secondary" 
              >
                Install
              </Button>
            </a>
          )
        }
      </div>
    ))
  }
</>
```

## Aptos API
The Aptos API is used to read data from the Aptos blockchain. In this dapp, the API is used to call view functions as well as query events emitted by the pay me a river module. 

### Calling view functions
The Aptos API can be used to call view functions. The API view function endpoint is: 
```
https://fullnode.testnet.aptoslabs.com/v1/view
```

Making a request to this endpoint can be done the following way: 
```tsx
// State to store balance with default value of "0"
const [balance, setBalance] = useState<string>("0");

// Get the account and connected state from the wallet adapter
const { account, connected } = useWallet();

// Calls the getBalance function when the account or connected state changes
useEffect(() => {
  if (connected && account) {
    getBalance(account.address);
  }
}, [connected, account]);

// Function to call the balance view function
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
          Accept: "application/json",
        },
      }
    )
  } catch (e) {
    setBalance("0");
    return;
  }

  const data = await res.json();

  setBalance((data / 100000000).toLocaleString());
}

// Div to display balance
<div>
  <h1>Balance: {balance}</h1>
</div>
```

### Retrieve account data 
The Aptos API can be used to retrieve account data. The API account endpoint is: 
```
https://fullnode.testnet.aptoslabs.com/v1/accounts/{address}
```
where `{address}` is the address of the account to retrieve data for.

Making a request to this endpoint can done the following way: 
```tsx
const getAccountData = async () => {
  // Making the API request
  const response = await fetch (
    `https://fullnode.testnet.aptoslabs.com/v1/accounts/${account.address}`,
    {
      method: 'GET'
    }
  );

  // Parsing the response into a json
  const accountData = await response.json();

  // If the response is the error code for account not found, the account has not been initialized
  if (accountData.error_code == 'account_not_found') {
    initializeAccount();
  } else {
    setAccountData(accountData);
  }

  console.log(accountData);
}
```

### Querying events
The Aptos API can be used to query events emitted by the pay me a river module. The API event endpoint is: 
```
https://fullnode.testnet.aptoslabs.com/v1/accounts/{address}/events/{event_handle}/{field_name}
```
where `{address}` is the address of the account that holds the object containing the events, `{event_handle}` is the type of the object that contains the events, and `{field_name}` is the name of the field that contains the events.

Making a request to this endpoint can be done the following way:
```tsx
// Event types
type Event = {
  type: "stream_created" | "stream_accepted" | "stream_claimed" | "stream_cancelled" | "unknown",
  timestamp: number,
  data: {
    amount?: number,
    amount_to_sender?: number,
    amount_to_recipient?: number,
  }
}

// connected and account state from the wallet adapter
const { connected, account } = useWallet();
// State to store events
const [events, setEvents] = useState([]);

// Updates the events state when the account or connected state changes
useEffect(() => {
  if (connected && account) {
    getEvents();
  } else {
    setEvents([]);
  }
}, [connected, account]);

/* 
  function to query `stream_create_events` events emitted by the pay me a river module 

  NOTE: The limit query parameter is set to 10000 to ensure that all events are returned. The 
        default limit is 75.
*/
const getEvents = async () => {
  const response = await fetch (
    `https://fullnode.testnet.aptoslabs.com/v1/accounts/${process.env.RESOURCE_ACCOUNT_ADDRESS}/events/${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::ModuleEventStore/stream_create_events?limit=10000`,
    {
      method: 'GET'
    }
  );

  const eventData = await response.json();

  console.log(eventData);

  setEvents(eventData);
}

// Div to display events
<div>
  <h1>Events</h1>
  {
    events.map((event) => (
      <div key={event.id}>
        <h2>Type: {event.type}</h2>
        <h3>Timestamp: {event.timestamp}</h3>
        {
          event.data.amount && 
          (
            <h3>Amount: {event.data.amount}</h3>
          )
        }
        {
          event.data.amount_to_sender && 
          (
            <h3>Amount to sender: {event.data.amount_to_sender}</h3>
          )
        }
        {
          event.data.amount_to_recipient && 
          (
            <h3>Amount to recipient: {event.data.amount_to_recipient}</h3>
          )
        }
      </div>
    ))
  }
</div>
```

## Aptos TS SDK
The Aptos TS SDK is used in this quest to fund uninitialized accounts. 

### Initializing and funding accounts
The SDK provides a client to help fund accounts with APT. If an account does not exist, the client will initialize the account as well as fund it. An aptos account can be initialized and funded by the following: 
```tsx
// Import the client from the TS SDK as well as the network enum
import { FaucetClient, Network } from "aptos";

// create a new client
const faucetClient = new FaucetClient(Network.TESTNET, "https://faucet.testnet.aptoslabs.com");

/* 
  Fund the account with 1 APT
  NOTE: The faucet's fundAccount will most likely fail when verifying the transactions. This is
       expected behavior and the account will still be initialized and funded.
*/
try {
  /*
    The faucet's fundAccount function takes the address of the account to fund, the amount of APT
    to fund the account with, and the number of seconds to wait before timing out.
  */
  await faucetClient.fundAccount(account.address, 100000000, 1);
} catch (e) {
  console.log(e);
}
```

## Aptos explorer

### Transaction link
The Aptos explorer can be used to view transaction details. The explorer transaction endpoint is: 
```
https://explorer.aptoslabs.com/txn/${transaction_hash}?network=testnet
```
where `{transaction_hash}` is the hash of the transaction to view.

### Account link
The Aptos explorer can be used to view account details. The explorer account endpoint is: 
```
https://explorer.aptoslabs.com/account/${account_address}?network=testnet
```
where `{account_address}` is the address of the account to view.
# Quest
## Deploying the dapp locally
  1. Navigate to the `app` directory
  2. Run `yarn install` to install dependencies
  3. Run `yarn dev` to start the development server
  4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result

## Completing the quest
  1. Read through the [Developer Cheat Sheet](#developer-cheat-sheet) above to understand the dapp and the supporting dependencies. Look back to that section for reference as you complete the quest.
  2. Visit and try out the demo dapp [here](https://pay-me-a-river-remastered-reference.vercel.app/). Feel free to use this demo as a reference as you complete the quest.
  3. Deploy and open the dapp locally as described [above](#deploying-the-dapp-locally). 
  4. Complete the quests by following the TODO comments in the following files (recommended order): 
       - [`walletSelector.tsx`](./app/components/walletSelector.tsx)
       - [`StreamRateIndicator.tsx`](./app/components/StreamRateIndicator.tsx)
       - [`payments/page.tsx`](./app/app/payments/page.tsx)
       - [`payments/StreamCreator.tsx`](./app/app/payments/StreamCreator.tsx)
       - [`payments/CreatedStreamList.tsx`](./app/app/payments/CreatedStreamList.tsx)
       - [`payments/ReceivedStream.tsx`](./app/app/payments/ReceivedStream.tsx)