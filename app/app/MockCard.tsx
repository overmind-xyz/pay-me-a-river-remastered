'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CopyIcon } from "@radix-ui/react-icons";
import CountUp from "react-countup";
import Image from "next/image";
import { useState } from "react";

const duration = 60000; // 60 seconds in milliseconds

export default function MockCard () {

  const [start, setStart] = useState(Date.now());
  const [progress, setProgress] = useState(0);

  setInterval(() => {
    const progress = ((Date.now() - start) / (duration)) * 100;
    setProgress(Math.min(progress, 100));
  }, 1);

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
            <CountUp
              start={0}
              end={100}
              duration={duration / 1000}
              separator=","
              decimals={2}
              decimal="."
              prefix=""
              suffix=""
              useEasing={false}
            />
          </div>

          <Progress
            value={progress}
            max={100}
            className="w-full bg-green-500 h-3 rounded"
          />

          <div className="flex flex-row items-center justify-between w-full">
            <p
              className="text-blue-400 hover:underline text-xs"
            >
              View History
            </p>

            <div className="flex flex-row items-center justify-end space-x-2 font-matter">
              <p className="text-sm text-neutral-100">Total:</p>
              <p className="text-lg">{100} APT</p>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-3 p-4 border-b border-neutral-200">
          <div className="w-full flex flex-row gap-3 items-center justify-between">
            <p className="text-neutral-100 text-sm">From:</p>
            <div
              className="font-matter bg-neutral-200 text-white hover:bg-neutral-100 space-x-2 text-xs px-3 flex flex-row items-center py-2 rounded hover:bg-opacity-25"
            >
              <p className="">
                0xca62ec...3cef8137
              </p>
              <CopyIcon />
            </div>
          </div>
          <div className="w-full flex flex-row gap-3 items-center justify-between">
            <p className="text-neutral-100 text-sm">End:</p>
            <p className="text-end text-sm">
              9/26/2023 4:47:20 PM
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex flex-row justify-between w-full gap-4 p-4">
          <Button
            className="grow bg-green-800 hover:bg-green-700 text-white"
          >
            Claim
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}