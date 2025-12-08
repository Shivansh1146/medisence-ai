import Image from "next/image";

export function Logo({ className = "", width = 40, height = 40 }: { className?: string; width?: number; height?: number }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Image
                src="/logo.svg"
                alt="MedicSense AI Logo"
                width={width}
                height={height}
                className="dark:invert-0"
            />
            <span className="font-bold text-xl tracking-tight">MedicSense AI</span>
        </div>
    );
}
