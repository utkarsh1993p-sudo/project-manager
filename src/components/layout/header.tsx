import { Bell, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header
      className="h-14 md:h-16 px-4 md:px-6 flex items-center justify-between shrink-0"
      style={{
        background: "rgba(15, 23, 41, 0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="pl-10 md:pl-0">
        <h1 className="text-base md:text-lg font-semibold text-white leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-slate-400 truncate max-w-xs md:max-w-none">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 md:w-9 md:h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all">
          <Search size={15} />
        </button>
        <button className="w-8 h-8 md:w-9 md:h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all relative">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
        </button>
      </div>
    </header>
  );
}
