import { NextRequest, NextResponse } from "next/server";
import { signUpWithPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const result = await signUpWithPassword(email, password, { name });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: result.user?.id,
          email: result.user?.email,
          name: result.user?.user_metadata?.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message?.includes("already registered")) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
