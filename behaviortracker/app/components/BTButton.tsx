"use client";

import { Button } from "@headlessui/react";
import { MouseEventHandler } from "react";

interface BTButtonProps {
  text: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export default function BTButton({ text, onClick }: BTButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md bg-gray-700 py-1.5 px-3 text-sm font-semibold text-white shadow-inner shadow-white/10 focus:outline-none hover:bg-gray-600 focus:outline-1 focus:outline-white"
    >
      {text}
    </Button>
  );
}
