import { NextRequest, NextResponse } from "next/server";
import { fetchLiveAsteroids } from "@/lib/nasa";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") || undefined;

    // Fetch the live asteroid array (with high-quality notable fallback integrated)
    const asteroids = await fetchLiveAsteroids(dateStr);

    return NextResponse.json(
      {
        success: true,
        count: asteroids.length,
        date: dateStr || new Date().toISOString().split("T")[0],
        asteroids: asteroids,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in asteroids API route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve asteroid data",
        asteroids: [],
      },
      { status: 500 }
    );
  }
}
