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

    /* 
      TODO #1: Fetch the receiver and sender streams using getReceiverStreams and getSenderStreams. 
            Then, calculate the stream rate by calculating and adding up the rate of APT per second 
            for each receiver stream and subtracting the rate of APT per second for each sender stream.
            Return the stream rate.
    */
    let aptPerSec = 0;
    const receiverStreams = await getReceiverStreams();
    const senderStreams = await getSenderStreams();
    console.log('receiverStreams')
    console.log(receiverStreams)
    console.log('senderStreams')
    console.log(senderStreams)
    if (receiverStreams) {
      receiverStreams.Active.forEach((stream: any) => {
        aptPerSec += stream[3] / stream[2]
      })
      }


    if (senderStreams) {
      senderStreams[0].forEach((stream: any) => {
        aptPerSec -= stream[3] / stream[2]
      })
    }

    return aptPerSec ? aptPerSec : 0;
  };

  const getSenderStreams = async () => {
    /*
     TODO #2: Validate the account is defined before continuing. If not, return.
   */
    console.log('account')
    console.log(account)
    if (!account) {
      return;
    }
    /*
       TODO #3: Make a request to the view function `get_senders_streams` to retrieve the streams sent by 
             the user.
    */
    const body = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::get_senders_streams`,
      arguments: [account.address],
      type_arguments: [],
    }

    const response = await fetch(`https://fullnode.testnet.aptoslabs.com/v1/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    data[3] = data[3].map((stream: any) => {
      return stream / 1000000000
    })

    data[1] = data[1].map((stream: any) => {
      return stream * 1000
    })

    console.log(data)
    return data;

    /* 
       TODO #4: Parse the response from the view request and create the streams array using the given 
             data. Return the new streams array.
 
       HINT:
        - Remember to convert the amount to floating point number
    */
  };

  const getReceiverStreams = async () => {
    /*
      TODO #5: Validate the account is defined before continuing. If not, return.
    */
    if (!account) {
      return;
    }
    /*
      TODO #6: Make a request to the view function `get_receivers_streams` to retrieve the streams sent by 
            the user.
    */
    const body = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::get_receivers_streams`,
      arguments: [account.address],
      type_arguments: [],
    }

    const response = await fetch(`https://fullnode.testnet.aptoslabs.com/v1/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    console.log(data)

    const returnData: {
      Pending: Stream[],
      Completed: Stream[],
      Active: Stream[],
    }= {
      Pending: [],
      Completed: [],
      Active: [],
    }
    //index 0 is address
    //index 1 is time stamp in seconds
    //index 2 is duration in seconds
    //index 3 is amount in APT
    //index 4 is id
    
    console.log(data)

    data[0].forEach((index: number) => {
          const streamObject: Stream = {
            sender: data[0][index],
            recipient: process.env.MODULE_ADDRESS as string,
            streamId: data[4][index],
            amountAptFloat: data[3][index],
            durationMilliseconds: data[2][index] * 1000,
            startTimestampMilliseconds: data[1][index] * 1000,
          }

          if (streamObject.startTimestampMilliseconds == 0) {
            returnData.Pending.push(streamObject)
          } else if (streamObject.startTimestampMilliseconds + streamObject.durationMilliseconds < Date.now()) {
            returnData.Completed.push(streamObject)
          }
          else {
            returnData.Active.push(streamObject)
          }
        })


    return returnData;

    /* 
      TODO #7: Parse the response from the view request and create an object containing an array of 
            pending, completed, and active streams using the given data. Return the new object.

      HINT:
        - Remember to convert the amount to floating point number
        - Remember to convert the timestamps to milliseconds
        - Mark a stream as pending if the start timestamp is 0
        - Mark a stream as completed if the start timestamp + duration is less than the current time
        - Mark a stream as active if it is not pending or completed
    */
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
