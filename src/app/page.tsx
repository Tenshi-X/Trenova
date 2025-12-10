import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Shield } from "lucide-react";

export default function Home() {
  redirect('/login');
}
