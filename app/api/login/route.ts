import { getAccountByEmail } from "@/app/db/account";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { email, password } = await request.json();
    const account = await getAccountByEmail(email);
    if (!account) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (account.password !== password) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    return NextResponse.json({ success: true, account });
}