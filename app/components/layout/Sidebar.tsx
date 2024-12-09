"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  // { name: "Spot Balances", href: "/spot", icon: CurrencyDollarIcon },
  // { name: "Futures Positions", href: "/futures", icon: ChartBarIcon },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  // { name: "Notifications", href: "/notifications", icon: BellIcon },
  { name: "Symbols", href: "/symbol", icon: BellIcon },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar: React.FC<{ onNavigate?: () => void }> = ({
  onNavigate,
}) => {
  const pathname = usePathname();

  return (
    <div className="fixed top-0 left-0 h-full w-64 flex flex-col bg-gray-800">
      <nav className="mt-5 flex-1 px-2 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate} // Add this
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              pathname === item.href
                ? "bg-gray-900 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <item.icon
              className="mr-3 flex-shrink-0 h-6 w-6"
              aria-hidden="true"
            />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};
