import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  CopyIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import CountUp from "react-countup";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToastAction } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { sleep } from "@/lib/utils";

export function parseDurationShort(durationMilliseconds: number): string {
  let durationSeconds = durationMilliseconds / 1000;
  let durationMinutes = durationSeconds / 60;
  let durationHours = durationMinutes / 60;
  let durationDays = durationHours / 24;
  let durationWeeks = durationDays / 7;
  let durationMonths = durationWeeks / 4;
  let durationYears = durationMonths / 12;

  if (durationYears >= 1) {
    return `${durationYears.toFixed(2)} years`;
  } else if (durationDays >= 1) {
    return `${durationDays.toFixed(2)} days`;
  } else if (durationHours >= 1) {
    return `${durationHours.toFixed(2)} hours`;
  } else if (durationMinutes >= 1) {
    return `${durationMinutes.toFixed(2)} minutes`;
  } else {
    return `${durationSeconds.toFixed(2)} seconds`;
  }
}

type Event = {
  type: "stream_created" | "stream_accepted" | "stream_claimed" | "stream_cancelled" | "unknown";
  timestamp: number;
  data: {
    amount?: number;
    amount_to_sender?: number;
    amount_to_recipient?: number;
  };
};

export default function ReceivedStream(props: {
  isTxnInProgress: boolean;
  setTxn: (isTxnInProgress: boolean) => void;
  senderAddress: string;
  startTimestampSeconds: number;
  durationSeconds: number;
  amountAptFloat: number;
  streamId: number;
}) {
  // wallet state
  const { account, signAndSubmitTransaction, connected } = useWallet();
  // toast state
  const { toast } = useToast();

  // time state for the progress bar
  const [timeNow, setTimeNow] = useState(Date.now());
  // event state for the history
  const [events, setEvents] = useState<Event[]>([]);
  

  /* 
    Refreshes the progress bar every second
  */
  setInterval(() => {
    setTimeNow(Date.now());
  }, 1000);

  /* 
    calculates the amount of APT to claim based on the time elapsed
  */
  const getAmountToClaim = () => {
    let timeElapsedSeconds = timeNow / 1000 - props.startTimestampSeconds;
    let timeElapsedFraction = timeElapsedSeconds / props.durationSeconds;
    let amountToClaim = props.amountAptFloat * timeElapsedFraction;
    return amountToClaim;
  };

  /* 
    Claim APT from the stream
  */
  const claimApt = async () => {

    props.setTxn(true)

      const payload = {
        function: `${process.env.MODULE_ADDRESS}::pay_me_a_river::claim_stream`,
        type_arguments: [],
        arguments: [
          props.senderAddress
        ],
        type: "entry_function_payload"
      }

      try {
        const result = await signAndSubmitTransaction(payload);
        await sleep(parseInt(process.env.TRANSACTION_DELAY_MILLISECONDS || '0'))

        toast({
          title: "APT claimed!",
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
    Accept the stream
  */
  const acceptStream = async () => {

    props.setTxn(true)

    const payload = {
      function: `${process.env.MODULE_ADDRESS}::pay_me_a_river::accept_stream`,
      type_arguments: [],
      arguments: [
        props.senderAddress
      ],
      type: "entry_function_payload"
    }

    try {
      const result = await signAndSubmitTransaction(payload);
      await sleep(parseInt(process.env.TRANSACTION_DELAY_MILLISECONDS || '0'))

      toast({
        title: "Stream accepted!",
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
    Reject the stream
  */
  const rejectStream = async () => {

    if (!account) {
      return;
    }

    props.setTxn(true)

    const payload = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::cancel_stream`,
      type_arguments: [],
      arguments: [
        props.senderAddress, account.address
      ],
      type: "entry_function_payload"
    }

    try {
      const result = await signAndSubmitTransaction(payload);
      await sleep(parseInt(process.env.TRANSACTION_DELAY_MILLISECONDS || '0'))

      toast({
        title: "Stream rejected",
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
    Fetches the event list from the event store
  */
  const getEventList = async (event_store_name: string): Promise<any[]> => {

    const response = await fetch (
      `https://fullnode.testnet.aptoslabs.com/v1/accounts/${process.env.RESOURCE_ACCOUNT_ADDRESS}/events/${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::ModuleEventStore/${event_store_name}?limit=10000`,
      {
        method: 'GET'
      }
    );
  
    const eventData = await response.json();
    let evtType : "stream_created" | "stream_accepted" | "stream_claimed" | "stream_cancelled" | "unknown" = "unknown";

    if (event_store_name == 'stream_create_events') {
      evtType = "stream_created";
    } else if (event_store_name == 'stream_accept_events') {
      evtType = "stream_accepted";
    } else if (event_store_name == 'stream_claim_events') {
      evtType = "stream_claimed";
    } else if (event_store_name == 'stream_close_events') {
      evtType = "stream_cancelled";
    }

    const events: Event[] = eventData.filter((event: any) => event.data.stream_id == props.streamId).map((event: any) => {
      const eventInfo: Event = {
        type: evtType, 
        timestamp: Number(event.data.timestamp),
        data: {
            amount: event.data.amount ? Number(event.data.amount) : undefined,
            amount_to_sender: undefined,
            amount_to_recipient: undefined,
          },
      }
      return eventInfo;
      }) || []

    return events
  };

  /* 
    Retrieves the stream events from the event store and sets the events state
  */
  const getStreamEvents = async () => {

      const streamCreateEvents  = await getEventList("stream_create_events");
      const streamAcceptEvents  = await getEventList("stream_accept_events");
      const streamClaimEvents  = await getEventList("stream_claim_events");
      const streamCloseEvents = await getEventList("stream_close_events");

      const allEvents = [
        ...streamCreateEvents,
        ...streamAcceptEvents,
        ...streamClaimEvents,
        ...streamCloseEvents,
      ];

      setEvents(allEvents);
  };

  const completed = (getAmountToClaim() > props.amountAptFloat)

  return (
    <Card className="relative bg-neutral-300 border border-neutral-200 rounded-lg">
      <CardContent className="flex flex-col justify-between">
        <div className="w-full flex flex-col border-b border-neutral-200 p-4 space-y-3">
          <div className="flex flex-row items-center font-matter text-2xl space-x-3">
            <Image
              src="/aptos-icon.svg"
              alt="Aptos Logo"
              width={22}
              height={22}
            />
            {

              props.startTimestampSeconds <= 0 && ( // - if the stream is not accepted yet, display the static total amount 
                <p>{props.amountAptFloat}</p>
              )
            }
            
            {
              (completed) && ( 
                //- Use the getAmountToClaim function and the amountAptFloat prop to determine if the stream is completed
                // - if the stream is completed, display the static total amount
                <p>{props.amountAptFloat}</p>
              )
            }
            
            {
              // - if the stream is active (accepted, but not completed), display the count up 
              // animation
              props.startTimestampSeconds > 0 && !(completed) && (
                <CountUp
                  start={getAmountToClaim()}
                  end={props.amountAptFloat}
                  duration={props.durationSeconds}
                  separator=","
                  decimals={8}
                  decimal="."
                  prefix=""
                  suffix=""
                  useEasing={false}
                />
              )
              
            }

            {
              !(completed) && ( // Show the reject button only if the stream is not completed 
                <div className="w-full flex items-center justify-end absolute top-4 right-4">
                  <div className="bg-neutral-200 text-neutral-100 p-1.5 rounded-md hover:text-red-400 hover:cursor-pointer hover:bg-neutral-100 hover:bg-opacity-25">
                    <p onClick={rejectStream}>
                      <Cross2Icon />
                    </p>
                  </div>
                </div>
              )
            }
          </div>

          {
            // - if the stream is not accepted yet, show a progress bar with 0 value
            props.startTimestampSeconds <= 0 && ( 
              <Progress value={0} max={100} className="w-full" />
            )
          }

          {
            // - if the stream is completed, show a progress bar with 100 value
            completed && ( 
              <Progress value={100} max={100} className="w-full" />
            )
          }

          { 
            //- if the stream is active (accepted, but not completed), show a progress bar with the percentage of the amount claimed
            props.startTimestampSeconds > 0 && !completed && ( 
              <Progress
                value={(getAmountToClaim() / props.amountAptFloat) * 100}
                max={100}
                className="w-full bg-green-500 h-3 rounded"
              />
            )
          }

          <div className="flex flex-row items-center justify-between w-full">
            <Dialog>
              <DialogTrigger>
                <p
                  className="text-blue-400 hover:underline text-xs"
                  onClick={getStreamEvents}
                >
                  View History
                </p>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="border-b border-neutral-300 pb-4">
                  <DialogTitle>Payment History</DialogTitle>
                </DialogHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Action</TableHead>
                      <TableHead className="text-center">Time</TableHead>
                      <TableHead className="text-center">
                        Additional info
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    { 
                      !events?.length && (
                        <TableRow>
                          <TableCell className="items-center">
                            <div className="flex flex-row justify-center items-center w-full">
                              <Skeleton className="h-4 w-28" />
                            </div>
                          </TableCell>
                          <TableCell className="items-center">
                            <div className="flex flex-row justify-center items-center w-full">
                              <Skeleton className="h-4 w-20" />
                            </div>
                          </TableCell>
                          <TableCell className="items-center">
                            <div className="flex flex-row justify-center items-center w-full">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }
                    {
                      events.map((evt: any) => {

                        return (
                          <TableRow key={evt.timestamp}>
                          <TableCell className="text-center">
                            {
                              evt.type === 'stream_created' && (
                                <>
                                  <span className="font-mono">
                                    Stream created
                                  </span>
                                </>
                              )
                            }
                            {
                              evt.type === 'stream_accepted' && (
                                <>
                                  <span className="font-mono">
                                    Stream accepted
                                  </span>
                                </>
                              )
                            }
                            {
                              evt.type === 'stream_claimed' && (
                                <>
                                  APT claimed
                                </>
                              )
                            }
                            {
                              evt.type === 'stream_cancelled' && (
                                <>
                                  Stream canceled
                                </>
                              )
                            }
                          </TableCell>
                          <TableCell className="text-center">
                            {new Date(evt.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            {
                              evt.type === 'stream_created' && (
                                <>
                                  <span className="font-mono">
                                    {evt.data.amount / 1e8 } APT streaming
                                  </span>
                                </>
                              )
                            }
                            {
                              evt.type === 'stream_accepted' && (
                                <>
                                  <span className="font-mono">No data</span>
                                </>
                              )
                            }
                            {
                              evt.type === 'stream_claimed' && (
                                <>
                                  <span className="font-mono">APT claimed</span>
                                </>
                              )
                            }
                            {
                              evt.type === 'stream_cancelled' && (
                                <>
                                  <span className="font-mono">
                                    Stream canceled
                                  </span>
                                </>
                              )
                            }
                          </TableCell>
                        </TableRow>
                        )
                      }) || []
                      
                    }
                  </TableBody>
                </Table>
              </DialogContent>
            </Dialog>

            <div className="flex flex-row items-center justify-end space-x-2 font-matter">
              <p className="text-sm text-neutral-100">Total:</p>
              <p className="text-lg">{props.amountAptFloat} APT</p>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-3 p-4 border-b border-neutral-200">
          <div className="w-full flex flex-row gap-3 items-center justify-between">
            <p className="text-neutral-100 text-sm">From:</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className="font-matter bg-neutral-200 text-white hover:bg-neutral-100 space-x-2 text-xs px-3 flex flex-row items-center py-2 rounded hover:bg-opacity-25"
                    onClick={() => {

                      navigator.clipboard.writeText(props.senderAddress);

                      toast({
                        description: "Address copied to clipboard",
                        action: (
                          <a
                            href={`https://explorer.aptoslabs.com/account/${props.senderAddress}`}
                            target="_blank"
                          >
                            <ToastAction altText="View account on explorer">
                              View on explorer
                            </ToastAction>
                          </a>
                        ),
                      });
                    }}
                  >
                    <p className="">
                      {`${props.senderAddress?.slice(
                        0,
                        6
                      )}...${props.senderAddress?.slice(-4)}`}
                    </p>
                    <CopyIcon />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="w-full">
                  <p>{props.senderAddress}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {
            props.startTimestampSeconds > 0 && (
              <div className="w-full flex flex-row gap-3 items-center justify-between">
                <p className="text-neutral-100 text-sm">End:</p>
                <p className="text-end text-sm">
                  {new Date(
                    (props.startTimestampSeconds + props.durationSeconds) * 1000
                  ).toLocaleString()}
                </p>
              </div>
            )
          }
          {
            props.startTimestampSeconds <= 0 && (
              <div className="w-full flex flex-row items-center justify-between">
                <p className="text-neutral-100 text-sm">Duration:</p>
                <span className="font-matter">
                  {parseDurationShort(props.durationSeconds * 1000)}
                </span>
              </div>
            )
          }
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex flex-row justify-between w-full gap-4 p-4">
          {
            props.startTimestampSeconds > 0 && !completed && (
              <Button
                className="grow bg-green-800 hover:bg-green-700 text-white"
                onClick={claimApt}
              >
                Claim
              </Button>
            )
          }
          
          {
            props.startTimestampSeconds <= 0 && (
              <Button
                className="grow bg-green-800 hover:bg-green-700 text-white"
                onClick={acceptStream}
              >
                Accept
              </Button>
            )
          }
          {
            props.startTimestampSeconds > 0 && !completed && (
              <Button
                className="grow bg-red-800 hover:bg-red-700 text-white font-matter"
                onClick={rejectStream}
              >
                Reject
              </Button>
            )
          }
        </div>
      </CardFooter>
    </Card>
  );
}
