import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import CountUp from "react-countup";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

export type Stream = {
  sender: string;
  recipient: string;
  amountAptFloat: number;
  durationMilliseconds: number;
  startTimestampMilliseconds: number;
  streamId: number;
};

export default function CreatedStreamList(props: {
  isTxnInProgress: boolean;
  setTxn: (isTxnInProgress: boolean) => void;
}) {
  // Wallet state
  const { connected, account, signAndSubmitTransaction, network } = useWallet();
  // Toast state
  const { toast } = useToast();
  // Streams state
  const [streams, setStreams] = useState<Stream[]>([]);
  const [areStreamsLoading, setAreStreamsLoading] = useState(true);

  /* 
    Retrieve the streams from the module and set the streams state.
  */
  useEffect(() => {
    if (connected) {
      getSenderStreams().then((streams) => {
        setStreams(streams as Stream[]);
        setAreStreamsLoading(false);
      });
    }
  }, [account, connected, props.isTxnInProgress]);
  /*
    Cancels a selected stream.
  */
  const cancelStream = async (recipient: string) => {
    /*
      TODO #7: Validate the account is defined before continuing. If not, return.
    */
    if (!account) return;
    /* 
      TODO #8: Set the isTxnInProgress state to true. This will display the loading spinner.
    */
    props.setTxn(true);
    /*
      TODO #9: Make a request to the entry function `cancel_stream` to cancel the stream. 
      
      HINT: 
        - In case of an error, set the isTxnInProgress state to false and return.
        - In case of success, display a toast notification with the transaction hash.

      -- Toast notification --
      toast({
        title: "Stream closed!",
        description: `Closed stream for ${`${recipient.slice(
          0,
          6
        )}...${recipient.slice(-4)}`}`,
        action: (
          <a
            href={`PLACEHOLDER: Input the explorer link here with the transaction hash`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    */
    const payload = {
      type: "entry_function_payload",
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::cancel_stream`,
      arguments: [account.address, recipient],
      type_arguments: [],
    };
    
    const res = await signAndSubmitTransaction(payload).catch((err) => {
      console.log(err);
      props.setTxn(false);
      return;
    });
      console.log(res)
    if (res) {
        toast({
        title: "Stream closed!",
        description: `Closed stream for ${`${recipient.slice(
          0,
          6
        )}...${recipient.slice(-4)}`}`,
        action: (
          <a
            href={`https://explorer.testnet.aptos.com/txn/${res.hash}?network=${network}`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
      }


    /*
      TODO #10: Set the isTxnInProgress state to false. This will hide the loading spinner.
    */
    props.setTxn(false);

  };

    const getSenderStreams = async () => {

    if (!account) return;

    const body = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::get_senders_streams`,
      arguments: [account.address],
      type_arguments: [],
    }
  
    const response = await fetch('https://fullnode.testnet.aptoslabs.com/v1/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    const returnArray = [] as Stream[];
    for (let i = 0; i < data[0].length; i++) {

      const streamObject: Stream = {
        sender: account.address,
        recipient: data[0][i],
        streamId: data[4][i],
        amountAptFloat: parseFloat(data[3][i]),
        durationMilliseconds: data[2][i] * 1000,
        startTimestampMilliseconds: data[1][i] * 1000,
      }

      returnArray.push(streamObject)
      }

    return returnArray;
  };

  return (
    <ScrollArea className="rounded-lg bg-neutral-400 border border-neutral-200 w-full">
      <div className="h-fit max-h-96 w-full">
        <Table className="w-full">
          <TableHeader className="bg-neutral-300">
            <TableRow className="uppercase text-xs font-matter hover:bg-neutral-300">
              <TableHead className="text-center">ID</TableHead>
              <TableHead className="text-center">Recipient</TableHead>
              <TableHead className="text-center">End date</TableHead>
              <TableHead className="text-center">Remaining amount</TableHead>
              <TableHead className="text-center">Cancel stream</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              /* 
                TODO #1: Add a skeleton loader when the streams are loading. Use the provided Skeleton component.

                HINT:
                  - Use the areStreamsLoading state to determine if the streams are loading.
                
              */
              areStreamsLoading && 
                <TableRow>
                  <TableCell className="items-center">
                    <div className="flex flex-row justify-center items-center w-full">
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell className="items-center">
                    <div className="flex flex-row justify-center items-center w-full">
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="items-center">
                    <div className="flex flex-row justify-center items-center w-full">
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="items-center">
                    <div className="flex flex-row justify-center items-center w-full">
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="items-center">
                    <div className="flex flex-row justify-center items-center w-full">
                      <Skeleton className="h-8 w-12" />
                    </div>
                  </TableCell>
                </TableRow>
            }
            {
              /* 
                TODO #2: Add a row to the table when there are no streams. Use the provided component
                          to display the message.

                HINT:
                  - Use the areStreamsLoading state to determine if the streams are loading.
                  - Use the streams state to determine if there are any streams.

              */
              !areStreamsLoading && streams.length === 0 &&
                <TableRow className="hover:bg-neutral-400">
                  <TableCell colSpan={5}>
                    <p className="break-normal text-center font-matter py-4 text-neutral-100">
                      You don&apos;t have any outgoing payments.
                    </p>
                  </TableCell>
                </TableRow>
            }
            {
              /* 
                TODO #3: Add a row to the table for each stream in the streams array. Use the provided
                          component to display the stream information.

                HINT:
                  - Use the areStreamsLoading state to determine if the streams are loading. Don't display
                    the streams if they are loading.
                  - Use the streams state to determine if there are any streams. 

                -- stream component --
                <TableRow
                  key={index}
                  className="font-matter hover:bg-neutral-400"
                >
                  <TableCell className="text-center">
                    PLACEHOLDER: Input the stream id here {0}
                  </TableCell>
                  <TableCell className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>PLACEHOLDER: truncate recipient address here</TooltipTrigger>
                        <TooltipContent>
                          <p>PLACEHOLDER: full recipient address here</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center">
                    {
                      TODO: Display the end date of the stream. If the stream has not started, 
                            display a message saying "Stream has not started". Use the provided 
                            component to display the date.

                      HINT: 
                        - Use the startTimestampMilliseconds to determine if the stream has started.
                        - Use the durationMilliseconds and startTimestampMilliseconds to calculate 
                          the end date.
                    
                      -- date component --
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {endDate.toLocaleDateString()}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{endDate.toLocaleString()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      -- message component --
                      <p>
                        <i>Stream has not started</i>
                      </p>
                    }
                  </TableCell>
                  <TableCell className="font-mono text-center">
                    {
                      TODO: Display the remaining amount of the stream. If the stream has not started,
                            display the full amount. Use the provided component to display the amount.
                      
                      HINT:
                        - Use the startTimestampMilliseconds to determine if the stream has started.
                        - Use the durationMilliseconds and startTimestampMilliseconds to determine if 
                          the stream has finished.

                      -- amount component (show when stream is completed) --
                      <p>0.00 APT</p>

                      -- amount component (show when stream is not completed) --
                      <CountUp
                        start={amountRemaining}
                        end={0}
                        duration={stream.durationMilliseconds / 1000}
                        decimals={8}
                        decimal="."
                        suffix=" APT"
                        useEasing={false}
                      />

                      -- amount component (show when stream has not started) --
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            PLACEHOLDER: Input the amount here (format to 2 decimal places)
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              PLACEHOLDER: Input the amount here (format to 8 decimal places)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      className="bg-red-800 hover:bg-red-700 text-white"
                      onClick={() => console.log('PLACEHOLDER: cancel stream')}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              */

              streams.map((stream, index) => {
              
                const truncatedRecipient = `${stream.recipient.slice(
                  0,
                  6
                )}...${stream.recipient.slice(-4)}`;
                
                const endDate = new Date(
                  stream.startTimestampMilliseconds +
                    stream.durationMilliseconds
                );

                const isStreamStarted = stream.startTimestampMilliseconds > 0;
                const isStreamFinished = Date.now() > stream.startTimestampMilliseconds + stream.durationMilliseconds;

                return (
               <TableRow
                  key={index}
                  className="font-matter hover:bg-neutral-400"
                >
                  <TableCell className="text-center">
                    {stream.streamId}
                  </TableCell>
                  <TableCell className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>{truncatedRecipient}</TooltipTrigger>
                        <TooltipContent>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center">
                    {/*
                      TODO: Display the end date of the stream. If the stream has not started, 
                            display a message saying "Stream has not started". Use the provided 
                            component to display the date.

                      HINT: 
                        - Use the startTimestampMilliseconds to determine if the stream has started.
                        - Use the durationMilliseconds and startTimestampMilliseconds to calculate 
                          the end date.
                    
                      -- date component --
                      */
                    stream.startTimestampMilliseconds ? 
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {endDate.toLocaleDateString()}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{endDate.toLocaleString()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      :
                      <p>
                        <i>Stream has not started</i>
                      </p>
                    }
                  </TableCell>
                  <TableCell className="font-mono text-center">
                    {/*
                      TODO: Display the remaining amount of the stream. If the stream has not started,
                            display the full amount. Use the provided component to display the amount.
                      
                      HINT:
                        - Use the startTimestampMilliseconds to determine if the stream has started.
                        - Use the durationMilliseconds and startTimestampMilliseconds to determine if 
                          the stream has finished.

                      -- amount component (show when stream is completed) --
                      */
                      <>
                        {isStreamStarted && (
                          isStreamFinished ? (
                          <p> 0.00 APT </p>
                          )
                        :
                        (
                        <CountUp
                          start={(stream.amountAptFloat / 100000000)}
                          end={0}
                          duration={stream.durationMilliseconds / 1000}
                          decimals={8}
                          decimal="."
                          suffix=" APT"
                          useEasing={false}
                        />
                        )
                      )}

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {(stream.amountAptFloat / 100000000).toFixed(2) + ' APT'}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {(stream.amountAptFloat / 100000000).toFixed(8)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      </>
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      className="bg-red-800 hover:bg-red-700 text-white"
                      onClick={() => cancelStream(stream.recipient)}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
                )}
              )}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
