import { NextResponse } from "next/server";
import { getUsers, getUser, updateUser, deleteUser } from "packages/users/src";
import { auth } from "@weddni/database/src/auth";

export async function GET(request: Request) {
  const session = await auth.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    try {
      const user = await getUser(id);
      if (user) {
        return NextResponse.json(user);
      } else {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 },
        );
      }
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  } else {
    try {
      const users = await getUsers();
      return NextResponse.json(users);
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
}

export async function PUT(request: Request) {
  const session = await auth.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, ...data } = await request.json();
    const user = await updateUser(id, data);
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { message: "User ID is required" },
      { status: 400 },
    );
  }

  try {
    await deleteUser(id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
