import {
  BookOpen, Calculator, Building2, FileText, BarChart2,
  TrendingUp, Briefcase, Scale, Landmark, CreditCard,
  PiggyBank, Receipt, Award, GraduationCap, Target,
  Globe, Lightbulb, ClipboardList, Database, Shield,
  Layers, LineChart, PieChart, DollarSign, Wallet,
  Banknote, Coins, Star, Trophy, Rocket, Key, Zap,
  Search, Users, Cpu, type LucideIcon,
} from "lucide-react";

export interface KelasIconDef {
  name: string;
  Icon: LucideIcon;
}

export const KELAS_ICONS: KelasIconDef[] = [
  { name: "BookOpen", Icon: BookOpen },
  { name: "Calculator", Icon: Calculator },
  { name: "Building2", Icon: Building2 },
  { name: "FileText", Icon: FileText },
  { name: "BarChart2", Icon: BarChart2 },
  { name: "TrendingUp", Icon: TrendingUp },
  { name: "Briefcase", Icon: Briefcase },
  { name: "Scale", Icon: Scale },
  { name: "Landmark", Icon: Landmark },
  { name: "CreditCard", Icon: CreditCard },
  { name: "PiggyBank", Icon: PiggyBank },
  { name: "Receipt", Icon: Receipt },
  { name: "Award", Icon: Award },
  { name: "GraduationCap", Icon: GraduationCap },
  { name: "Target", Icon: Target },
  { name: "Globe", Icon: Globe },
  { name: "Lightbulb", Icon: Lightbulb },
  { name: "ClipboardList", Icon: ClipboardList },
  { name: "Database", Icon: Database },
  { name: "Shield", Icon: Shield },
  { name: "Layers", Icon: Layers },
  { name: "LineChart", Icon: LineChart },
  { name: "PieChart", Icon: PieChart },
  { name: "DollarSign", Icon: DollarSign },
  { name: "Wallet", Icon: Wallet },
  { name: "Banknote", Icon: Banknote },
  { name: "Coins", Icon: Coins },
  { name: "Star", Icon: Star },
  { name: "Trophy", Icon: Trophy },
  { name: "Rocket", Icon: Rocket },
  { name: "Key", Icon: Key },
  { name: "Zap", Icon: Zap },
  { name: "Search", Icon: Search },
  { name: "Users", Icon: Users },
  { name: "Cpu", Icon: Cpu },
];

export function getKelasIcon(name: string | null | undefined): LucideIcon {
  return KELAS_ICONS.find((i) => i.name === name)?.Icon ?? BookOpen;
}

export function KelasIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = getKelasIcon(name);
  return <Icon className={className} />;
}
