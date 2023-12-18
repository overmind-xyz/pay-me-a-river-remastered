import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
import { Types } from "aptos";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sleep } from "@/lib/utils";

/* 
  Parses the duration string and returns the duration in seconds. The duration string is in the format
  of "1 month", "2 years", "3 days", etc. The supported units are: "second", "minute", "hour", "day",
  "week", "month", "year". If the duration string is invalid, 0 is returned.
  @param duration - The duration string to parse.
*/
export function parseDuration(duration: string): number {
  // parse string
  const [amount, unit] = duration.split(" ");
  // convert amount to number
  const amountNum = parseFloat(amount);
  // convert unit to seconds
  switch (unit) {
    case "second":
    case "seconds":
      return amountNum;
    case "minute":
    case "minutes":
      return amountNum * 60;
    case "hour":
    case "hours":
      return amountNum * 60 * 60;
    case "day":
    case "days":
      return amountNum * 60 * 60 * 24;
    case "week":
    case "weeks":
      return amountNum * 60 * 60 * 24 * 7;
    case "month":
    case "months":
      return amountNum * 60 * 60 * 24 * 30;
    case "year":
    case "years":
      return amountNum * 60 * 60 * 24 * 365;
    default:
      return 0;
  }
}

export default function StreamCreator(props: {
  isTxnInProgress: boolean;
  setTxn: (isTxnInProgress: boolean) => void;
}) {
  // wallet state
  const { signAndSubmitTransaction } = useWallet();

  // form state
  const [address, setAddress] = useState<string>("");
  const [amount, setAmount] = useState("1");
  const [duration, setDuration] = useState<string>("");

  // toast state
  const { toast } = useToast();

  /* 
    Creates a stream using the address, amount, and date state variables. This function is called
    when the "Start Stream" button is clicked.
  */
  const startStream = async () => {

    if (!address || !amount || !duration) {
      return;
    }

    const amt = parseFloat(amount)

    if (typeof amt !== 'number' || amt < 0) {
      return; 
    }

    props.setTxn(true)

    setAddress("")
    setAmount("1")
    setDuration("")

    const payload: Types.TransactionPayload = {
      type: "entry_function_payload", 
      function: `${process.env.MODULE_ADDRESS}::pay_me_a_river::create_stream`,
      type_arguments: [],
      arguments: [address, amount * 1e8, parseDuration(duration) * 1e8 ],
    };

    try {
      const result = await signAndSubmitTransaction(payload);
      await sleep(parseInt(process.env.TRANSACTION_DELAY_MILLISECONDS || '0'))

      toast({
        title: "Stream created!",
        description: `Stream created: to ${`${address.slice(
          0,
          6
        )}...${address.slice(-4)}`} for ${amount} APT`,
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

  return (
    <div className="w-full font-matter">
      <div className="border-b border-neutral-300 pb-3">
        <p className="font-cal text-2xl">Create Payment</p>
      </div>
      <div className="w-full">
        <div className="grid w-full items-center gap-3 my-4">
          <Label htmlFor="address">Recipient address</Label>
          <Input
            type="text"
            id="address"
            placeholder="0x59d870...f469ae14"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="grid w-full items-center gap-3 my-4">
          <Label htmlFor="duration" className="flex flex-row items-center">
            Duration
            <Dialog>
              <DialogTrigger>
                <QuestionMarkCircledIcon className="ml-1.5 inline-block" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>What are the valid units?</DialogTitle>
                  <DialogDescription>
                    The valid units are: &quot;second&quot;, &quot;minute&quot;, &quot;hour&quot;, &quot;day&quot;,
                    &quot;week&quot;, &quot;month&quot;, &quot;year&quot; (with or without &quot;s&quot; at the end).
                    <br />
                    <br />
                    For example, a valid duration is &quot;1 month&quot;, &quot;2 years&quot;, &quot;3.5
                    days&quot;, etc.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </Label>
          <Input
            type="string"
            id="duration"
            placeholder="3 months"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <div className="grid w-full items-center gap-3">
          <Label htmlFor="amount">Amount (APT)</Label>
          <Input
            type="number"
            id="amount"
            placeholder="Amount of APT"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>
      <div className="pt-6">
        <Button
          className="w-full bg-green-800 hover:bg-green-700 text-white"
          disabled={
            address === "" ||
            parseDuration(duration) < 1 ||
            parseFloat(amount) === 0
          }
          onClick={() => startStream()}
        >
          Start Stream
        </Button>
      </div>
    </div>
  );
}
