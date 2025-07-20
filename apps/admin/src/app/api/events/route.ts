import { NextResponse } from "next/server";
import { createEvent, getEvent, getEvents, updateEvent, deleteEvent, } from "@mounasabet/events";
import { auth } from "@mounasabet/database/src/auth";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    try {
      const event = await getEvent(id);
      if (event) {
        return NextResponse.json(event);
      } else {
        return NextResponse.json(
          { message: "Event not found" },
          { status: 404 },
        );
      }
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  } else {
    try {
      const events = await getEvents();
      return NextResponse.json(events);
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const event = await createEvent(data);
    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    if (
      error.message.includes("required") ||
      error.message.includes("must be a string")
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    } else {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, ...data } = await request.json();
    const event = await updateEvent(id, data);
    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { message: "Event ID is required" },
      { status: 400 },
    );
  }

  try {
    await deleteEvent(id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
