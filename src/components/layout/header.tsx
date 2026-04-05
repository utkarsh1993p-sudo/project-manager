import { Bell, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-14 md:h-16 border-b border-gray-200 bg-white px-4 md:px-6 flex items-center justify-between shrink-0">
      {/* Left — leave space for mobile hamburger (44px) */}
      <div className="pl-10 md:pl-0">
        <h1 className="text-base md:text-lg font-semibold text-gray-900 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-gray-500 truncate max-w-xs md:max-w-none">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 md:w-9 md:h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <Search size={15} />
        </button>
        <button className="w-8 h-8 md:w-9 md:h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors relative">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
        </button>
      </div>
    </header>
  );
}
