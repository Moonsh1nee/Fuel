import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Apple, Dumbbell, Settings } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/nutrition", label: "Питание", icon: Apple },
  { href: "/workouts", label: "Тренировки", icon: Dumbbell },
  { href: "/settings", label: "Настройки", icon: Settings },
];
