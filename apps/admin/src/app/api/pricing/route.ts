import { NextResponse } from "next/server";
import { createBooking, getBooking, getPricingPlans} from "@mounasabet/pricing";
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
      const booking = await getBooking(id);
      if (booking) {
        return NextResponse.json(booking);
      } else {
        return NextResponse.json(
          { message: "Booking not found" },
          { status: 404 },
        );
      }
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  } else {
    try {
      const pricingPlans = await getPricingPlans();
      return NextResponse.json(pricingPlans);
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
    const booking = await createBooking(data);
    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
