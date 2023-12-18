"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  LinkBreak2Icon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import ReceivedStream from "./ReceivedStream";
import CreatedStreamList, { Stream } from "./CreatedStreamList";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReceivedStreamSkeleton from "./ReceivedStreamSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarLoader } from "react-spinners";
import { NoWalletConnected } from "@/components/NoWalletConnected";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import StreamCreator from "./StreamCreator";

enum Sort {
  MostRecent = "Most Recent",
  Oldest = "Oldest",
  EndDateCloseToFar = "End Date - Close to Far",
  EndDateFarToClose = "End Date - Far to Close",
  TotalAmountLowToHigh = "Total Amount - Low to High",
  TotalAmountHightToLow = "Total Amount - High to Low",
  ClaimableAmountHighToClose = "Claimable Amount - High to Low",
  ClaimableAmountCloseToHigh = "Claimable Amount - Low to High",
}
function stringToSortEnum(value: string): Sort | null {
  if (Object.values(Sort).indexOf(value as Sort) >= 0) {
    return value as Sort;
  }
  return null;
}

enum Status {
  Active = "Active",
  Completed = "Completed",
}
function stringToStatusEnum(value: string): Status | null {
  if (Object.values(Status).indexOf(value as Status) >= 0) {
    return value as Status;
  }
  return null;
}

export default function ClaimerPage() {
  // Wallet state
  const { isLoading, connected, account, network } = useWallet();
  // receiver streams state
  const [streams, setStreams] = useState<{
    Completed: Stream[];
    Active: Stream[];
  }>({ Completed: [], Active: [] });

  // loading states
  const [txnInProgress, setTxnInProgress] = useState(false);
  const [areStreamsLoading, setAreStreamsLoading] = useState(true);

  // dropdown states
  const [sort, setSort] = useState(Sort.MostRecent);
  const [status, setStatus] = useState(Status.Active);

  // button disabled states
  const [isCreatePaymentOpen, setIsCreatePaymentOpen] = useState(false);

  /* 
    Disables the create payment button if a transaction is in progress.
  */
  useEffect(() => {
    if (txnInProgress) setIsCreatePaymentOpen(false);
  }, [isCreatePaymentOpen, txnInProgress]);

  /* 
    Fetches the receiver streams when the wallet is connected.
  */
  useEffect(() => {
    if (connected && !txnInProgress) {
      getReceiverStreams().then((streams) => {
        setStreams({
          Active: [...streams.Pending, ...streams.Active],
          Completed: streams.Completed,
        });
        setAreStreamsLoading(false);
      });
    }
  }, [account, connected, txnInProgress]);

  /* 
    Retrieves the receiver streams. 
  */
  const getReceiverStreams = async () => {
  
    if (!account) {
      return;
    }

    setAreStreamsLoading(true)

    const body = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::get_receivers_streams`,
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

    const [
      sender_addresses,
      start_timestamp_seconds,
      duration_in_seconds,
      stream_amounts,
      stream_ids,
    ] = Array.from<Array<string>>(data as any);
  
    const streams = sender_addresses?.map((sender_address, i) => {
      return {
        address: sender_address,
        start: parseInt(start_timestamp_seconds[i] ?? 0) * 1000,
        duration: parseInt(duration_in_seconds[i] ?? 0) * 1000,
        stream_amounts: parseFloat(stream_amounts[i] ?? 0) / 100_000_000,
        stream_id: stream_ids[i],
      };
    });
    
    const currentTime = Date.now();
  
    const pendingStreams = [];
    const completedStreams = [];
    const activeStreams = [];
  
    for (let i = 0; i < streams.length; i++) {
      const stream = streams[i];
      if (stream.start === 0) {
        pendingStreams.push(stream);
      } else if (stream.start + stream.duration > currentTime) {
        activeStreams.push(stream);
      } else {
        completedStreams.push(stream);
      }
    }
  
    return {
      Pending: pendingStreams,
      Completed: completedStreams,
      Active: activeStreams,
    };
  };

  /* 
    displays a message if the wallet is not connected
  */
  if (!connected) {
    return <NoWalletConnected />;
  }

  const getAmountToClaim = (startTimestampSeconds: any, durationSeconds: any, amountAptFloat: any ) => {
    let timeElapsedSeconds = Date.now() / 1000 - startTimestampSeconds;
    let timeElapsedFraction = timeElapsedSeconds / durationSeconds;
    let amountToClaim = amountAptFloat * timeElapsedFraction;
    return amountToClaim;
  };

  return (
    <>
      {
        txnInProgress
        ? (
            <div className="bg-neutral-900/50 backdrop-blur absolute top-0 bottom-0 left-0 right-0 z-50 m-auto flex items-center justify-center">
              <div className="p-6 flex flex-col items-center justify-center space-y-4">
                <BarLoader color="#10B981" />
                <p className="text-lg font-medium">Processing Transaction</p>
              </div>
            </div>
        )
        : null
      }

      <>
        {
          connected && !isLoading && network?.name !== "Testnet"
          ? (
            <Alert variant="destructive" className="w-fit mb-2 mr-2">
              <LinkBreak2Icon className="h-4 w-4" />
              <AlertTitle>Switch your network!</AlertTitle>
              <AlertDescription>
                You need to switch your network to Testnet before you can use
                this app.
              </AlertDescription>
            </Alert>
          )
          : null
        }

        {!isLoading &&
          connected &&
          network &&
          network.name.toString() == "Testnet" && (
            <div className="w-full flex items-center justify-center py-5 px-6">
              <div className="flex flex-col items-start justify-start grow gap-4 w-full max-w-6xl">
                <div className="flex flex-col space-y-3 border-b border-neutral-300 w-full pb-5">
                  <div className="flex flex-row items-end justify-between w-full">
                    <p className="text-4xl font-bold font-cal">
                      Outgoing Payments
                    </p>

                    <Dialog
                      open={isCreatePaymentOpen}
                      onOpenChange={setIsCreatePaymentOpen}
                    >
                      <DialogTrigger>
                        <Button className="bg-green-800 text-white font-matter px-3 hover:bg-green-700">
                          Create Payment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <StreamCreator
                          setTxn={setTxnInProgress}
                          isTxnInProgress={txnInProgress}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="w-full">
                  <CreatedStreamList
                    setTxn={setTxnInProgress}
                    isTxnInProgress={txnInProgress}
                  />
                </div>

                <div className="flex flex-col space-y-3 border-b border-neutral-300 w-full pb-5">
                  <div className="flex flex-row items-end justify-between w-full">
                    <p className="text-4xl font-bold font-cal">
                      Incoming Payments
                    </p>

                    <div className="flex flex-row gap-3 items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="bg-neutral-300 text-white hover:bg-neutral-200">
                            {status} streams{" "}
                            <ChevronDownIcon className="ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Stream status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioGroup
                            value={status}
                            onValueChange={(value) => {
                              setStatus(
                                stringToStatusEnum(value) || Status.Active
                              );
                            }}
                          >
                            <DropdownMenuRadioItem value={Status.Active}>
                              {Status.Active} streams - {streams.Active.length}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value={Status.Completed}>
                              {Status.Completed} streams -{" "}
                              {streams.Completed.length}
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="bg-neutral-300 text-white hover:bg-neutral-200">
                            {sort} <ChevronDownIcon className="ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Sorting methods</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioGroup
                            value={sort}
                            onValueChange={(value) => {
                              setSort(
                                stringToSortEnum(value) || Sort.MostRecent
                              );
                            }}
                          >
                            <DropdownMenuRadioItem value={Sort.MostRecent}>
                              {Sort.MostRecent}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value={Sort.Oldest}>
                              {Sort.Oldest}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value={Sort.ClaimableAmountHighToClose}
                            >
                              {Sort.ClaimableAmountHighToClose}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value={Sort.ClaimableAmountCloseToHigh}
                            >
                              {Sort.ClaimableAmountCloseToHigh}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value={Sort.TotalAmountHightToLow}
                            >
                              {Sort.TotalAmountHightToLow}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value={Sort.TotalAmountLowToHigh}
                            >
                              {Sort.TotalAmountLowToHigh}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value={Sort.EndDateFarToClose}
                            >
                              {Sort.EndDateFarToClose}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value={Sort.EndDateCloseToFar}
                            >
                              {Sort.EndDateCloseToFar}
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                <div className="w-full flex flex-col items-center gap-4">
                  {(isLoading || areStreamsLoading) && (
                    <div className="grid grid-cols-1 gap-5 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full">
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                      <ReceivedStreamSkeleton />
                    </div>
                  )}

                  {
                    !streams[status]?.length && (
                      <div className="flex flex-col space-y-1 items-center justify-center w-full bg-neutral-400 border border-neutral-300 py-12 px-6 font-matter rounded-lg">
                        <p className="text-2xl font-medium">
                          No Incoming Payments
                        </p>
                        <p className="text-neutral-100 text-lg">
                          You do not have any {status.toLowerCase()} payments.
                        </p>
                      </div>
                    )
                  }

                  {
                    streams[status]?.length && (
                      <div className="grid grid-cols-1 gap-5 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full">
                        {streams[status]
                          .map((stream) => {
                            return (
                              <ReceivedStream
                                key={stream.stream_id}
                                isTxnInProgress={txnInProgress}
                                setTxn={setTxnInProgress}
                                senderAddress={stream.address}
                                amountAptFloat={stream.stream_amounts}
                                durationSeconds={
                                  stream.duration / 1000
                                }
                                startTimestampSeconds={
                                  stream.start / 1000
                                }
                                streamId={stream.stream_id}
                              />
                            );
                          })
                          .sort((a, b) => {
                            
                            const streamIdA = parseInt(a.props.streamId, 10);
                            const streamIdB = parseInt(b.props.streamId, 10);

                            const streamEndDateA = a.props.startTimestampSeconds + a.props.durationSeconds
                            const streamEndDateB = b.props.startTimestampSeconds + b.props.durationSeconds

                            const claimableFromA = getAmountToClaim(
                                a.props.startTimestampSeconds, 
                                a.props.durationSeconds, 
                                a.props.amountAptFloat
                            )

                            const claimableFromb = getAmountToClaim(
                              b.props.startTimestampSeconds, 
                              b.props.durationSeconds, 
                              b.props.amountAptFloat
                          )

                            switch (sort) {
                              case Sort.MostRecent:
                                if (streamIdA < streamIdB) {
                                  return 1; 
                                } else if (streamIdA > streamIdB) {
                                  return -1; 
                                } else {
                                  return 0; 
                                }

                              case Sort.Oldest:
                                if (streamIdA < streamIdB) {
                                  return -1; 
                                } else if (streamIdA > streamIdB) {
                                  return 1; 
                                } else {
                                  return 0; 
                                }

                              case Sort.TotalAmountHightToLow:
                                if (a.props.amountAptFloat < b.props.amountAptFloat) {
                                  return 1; 
                                } else if (a.props.amountAptFloat > b.props.amountAptFloat) {
                                  return -1; 
                                } else {
                                  return 0; 
                                }

                              case Sort.TotalAmountLowToHigh:
                                if (a.props.amountAptFloat > b.props.amountAptFloat) {
                                  return 1; 
                                } else if (a.props.amountAptFloat < b.props.amountAptFloat) {
                                  return -1; 
                                } else {
                                  return 0; 
                                }

                              case Sort.EndDateFarToClose:
                                if (streamEndDateA < streamEndDateB) {
                                  return 1; 
                                } else if (streamEndDateA > streamEndDateB) {
                                  return -1; 
                                } else {
                                  return 0; 
                                }

                              case Sort.EndDateCloseToFar:
                                if (streamEndDateB < streamEndDateA) {
                                  return 1; 
                                } else if (streamEndDateB > streamEndDateA) {
                                  return -1; 
                                } else {
                                  return 0; 
                                }

                              case Sort.ClaimableAmountHighToClose:
                                if (claimableFromA < claimableFromb) {
                                  return 1; 
                                } else if (claimableFromA > claimableFromb) {
                                  return -1; 
                                } else {
                                  return 0; 
                                }
                                
                              case Sort.ClaimableAmountCloseToHigh:
                                if (claimableFromb < claimableFromA) {
                                  return 1; 
                                } else if (claimableFromb > claimableFromA) {
                                  return -1; 
                                } else {
                                  return 0; 
                                }

                              default:
                                if (streamIdA < streamIdB) {
                                  return 1; 
                                } else if (streamIdA > streamIdB) {
                                  return -1; 
                                } else {
                                  return 0; 
                                }
                            }
                          })}
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
          )}
      </>
    </>
  );
}
