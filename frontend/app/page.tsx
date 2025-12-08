import { ChatInterface } from "@/components/ChatInterface";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
        <div className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          <Logo />
        </div>
      </div>

      <div className="relative flex place-items-center w-full">
        <ChatInterface />
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground max-w-md">
        <p>
          Disclaimer: This is an AI assistant and not a substitute for professional medical advice.
          In case of emergency, please call your local emergency number immediately.
        </p>
      </div>
    </main>
  );
}
