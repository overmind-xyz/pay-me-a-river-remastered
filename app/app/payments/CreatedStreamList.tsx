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
  const { connected, account, signAndSubmitTransaction } = useWallet();
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
        setStreams(streams);
        setAreStreamsLoading(false);
      });
    }
  }, [account, connected, props.isTxnInProgress]);

  /*
    Cancels a selected stream.
  */
  const cancelStream = async (recipient: string) => {

    if (!account) {
      return;
    }

    props.setTxn(true)

    const payload = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::cancel_stream`,
      type_arguments: [],
      arguments: [
        account.address, recipient
      ],
      type: "entry_function_payload"
    }

    try {
      const result = await signAndSubmitTransaction(payload);
      await sleep(parseInt(process.env.TRANSACTION_DELAY_MILLISECONDS || '0'))

      toast({
        title: "Stream closed!",
        description: `Closed stream for ${`${recipient.slice(
          0,
          6
        )}...${recipient.slice(-4)}`}`,
        action: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${result.hash}?network=testnet`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });

    } catch (e) {
      console.log(e);
      props.setTxn(false)
      return;
    }

    props.setTxn(false)

  };

  /* 
    Retrieves the sender streams. 
  */
  const getSenderStreams = async () => {

    if (!account) {
      return;
    }

    const body = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::get_senders_streams`,
      type_arguments: [],
      arguments: [account.address],
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
      console.log('e', e)
      return;
    }

    const data = await res.json();

    let streams = [];

    streams = data.map((stream: any) => parseFloat(stream));

    const [
      receiver_addresses,
      start_timestamp_seconds,
      duration_in_seconds,
      stream_amounts,
      stream_ids,
    ] = Array.from<Array<string>>(data as any);

    return receiver_addresses?.map((receiver_address, i) => {
      return {
        address: receiver_address,
        start: parseInt(start_timestamp_seconds[i] ?? 0) * 1000,
        duration: parseInt(duration_in_seconds[i] ?? 0) * 1000,
        stream_amounts: parseFloat(stream_amounts[i] ?? 0) / 100_000_000,
        stream_id: stream_ids[i],
      };
    });
    
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
              areStreamsLoading 
              && (
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
              )
            }
            {
              !areStreamsLoading && !streams?.length && (
                <TableRow className="hover:bg-neutral-400">
                  <TableCell colSpan={5}>
                    <p className="break-normal text-center font-matter py-4 text-neutral-100">
                      You don&apos;t have any outgoing payments.
                    </p>
                  </TableCell>
                </TableRow>
              )
            }
            {

              streams?.map((strm: any, index: number) => {

                const endDate = strm?.start + strm?.duration
                
                return (
                    <TableRow
                      key={index}
                      className="font-matter hover:bg-neutral-400"
                    >
                      <TableCell className="text-center">
                        {strm?.stream_id}
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>{shortenString(strm?.address)}</TooltipTrigger>
                            <TooltipContent>
                              <p>{strm?.address}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-center">
                        {
                          strm?.start > 0 
                          ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {new Date(endDate).toLocaleDateString()}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{new Date(endDate).toLocaleString()}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                          : (
                            <p>
                              <i>Stream has not started</i>
                            </p>
                          )
                        }
                      </TableCell>
                      <TableCell className="font-mono text-center">
                        {
                          strm?.start > 0 
                          ? (
                            Date.now() > endDate
                            ? (
                              <p>0.00 APT</p>
                            )
                            : (
                              <CountUp
                                start={strm?.stream_amounts*((endDate - Date.now())/strm.duration)}
                                end={0}
                                duration={strm.duration / 1000}
                                decimals={8}
                                decimal="."
                                suffix=" APT"
                                useEasing={false}
                              />
                            )
                          )
                          : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <p>{strm?.stream_amounts} APT</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {strm?.address}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          className="bg-red-800 hover:bg-red-700 text-white"
                          onClick={() => cancelStream(strm.address)}
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                )
              }) || []

              }
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
