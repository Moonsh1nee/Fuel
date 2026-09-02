import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Apple, ChefHat, Dumbbell, Settings } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/nutrition", label: "Питание", icon: Apple },
  { href: "/recipes", label: "Рецепты", icon: ChefHat },
  { href: "/workouts", label: "Тренировки", icon: Dumbbell },
  { href: "/settings", label: "Настройки", icon: Settings },
];
