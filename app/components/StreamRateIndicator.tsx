import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Stream } from "@/app/payments/CreatedStreamList";

/* 
  Finds the best unit to display the stream rate in by changing the bottom of the unit from seconds
  to minutes, hours, days, etc.
*/
function displayStreamRate(streamRatePerSecond: number) {
  if (streamRatePerSecond == 0) {
    return "0 APT / s";
  }

  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / s`;
  }

  streamRatePerSecond *= 60; // to minutes
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / min`;
  }

  streamRatePerSecond *= 60; // to hours
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / hr`;
  }

  streamRatePerSecond *= 24; // to days
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / day`;
  }

  streamRatePerSecond *= 7; // to weeks
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / week`;
  }

  streamRatePerSecond *= 4; // to months
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / month`;
  }

  streamRatePerSecond *= 12; // to years

  return `${streamRatePerSecond.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  })} APT / year`;
}

export default function StreamRateIndicator() {
  // wallet adapter state
  const { isLoading, account, connected } = useWallet();
  // stream rate state
  const [streamRate, setStreamRate] = useState(0);

  /* 
    Calculates and sets the stream rate
  */
  useEffect(() => {
    calculateStreamRate().then((streamRate) => {
      setStreamRate(streamRate);
    });
  });

  /*
    Calculates the stream rate by adding up all of the streams the user is receiving and subtracting
    all of the streams the user is sending.
  */
  const calculateStreamRate = async () => {

    const receiverStreams = await getReceiverStreams();
    const senderSteams = await getSenderStreams();

    const activeReceiverSteams = receiverStreams?.Active

    let receivingStreamRate = 0

    activeReceiverSteams?.forEach((s: any) => {
      const durationInSeconds = s?.duration / 1000
      const aptPerSecond = s?.stream_amounts / durationInSeconds
      receivingStreamRate += aptPerSecond
    })

    let sendingStreamRate = 0

    senderSteams?.forEach((s: any) => {
      const durationInSeconds = s?.duration / 1000
      const aptPerSecond = (s?.stream_amounts) / durationInSeconds
      sendingStreamRate += aptPerSecond
    })

    let aptPerSec = receivingStreamRate - sendingStreamRate;

    return aptPerSec;
  };

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

  const getReceiverStreams = async () => {

    if (!account) {
      return;
    }

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

  if (!connected) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-neutral-500 hover:bg-neutral-500 px-3">
          <div className="flex flex-row gap-3 items-center">
            <InfoCircledIcon className="h-4 w-4 text-neutral-100" />

            <span
              className={
                "font-matter " +
                (streamRate > 0
                  ? "text-green-400"
                  : streamRate < 0
                  ? "text-red-400"
                  : "")
              }
            >
              {isLoading || !connected ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                displayStreamRate(streamRate)
              )}
            </span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your current stream rate</DialogTitle>
          <DialogDescription>
            This is the current rate at which you are streaming and being
            streamed APT. This rate is calculated by adding up all of the
            streams you are receiving and subtracting all of the streams you are
            sending.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
