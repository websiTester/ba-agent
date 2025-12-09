import { createAccount, getAccountByEmail } from "@/app/db/account";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { email, password } = await request.json();
    const account = await getAccountByEmail(email);
    if (account) {
        return NextResponse.json({ error: "Account already exists" }, { status: 400 });
    }
    const newAccount = await createAccount({ email, password, createdAt: new Date(), updatedAt: new Date() });
    return NextResponse.json({ success: true, account: newAccount });
}