import { NextResponse } from "next/server";
import { createLogoutCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", createLogoutCookie());
  return res;
}
