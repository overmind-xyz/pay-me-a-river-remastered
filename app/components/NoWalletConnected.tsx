import { ArrowTopRightIcon } from "@radix-ui/react-icons";

export const NoWalletConnected = () => {
  return (
    <div className="flex items-center justify-center w-full py-12">
      <div className="max-w-6xl w-full flex flex-col space-y-6 items-center justify-center">
        <div className="flex items-end w-full justify-end max-w-4xl">
          <ArrowTopRightIcon className="h-24 w-24 text-red-500" />
        </div>

        <p className="text-7xl font-cal">No Wallet Connected</p>
        <p className="text-neutral-100 text-xl">
          Please connect your wallet to gain access to this page.
        </p>
      </div>
    </div>
  );
};
