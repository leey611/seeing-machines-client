import { NextResponse } from "next/server"

// This is Route based
// route.js -> /api/
// test/route.js /api/test
// myawesomehandler/route.js /api/myawesomehandler
export async function GET() {
    // const res = await fetch('https://data.mongodb-api.com/...', {
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'API-Key': process.env.DATA_API_KEY,
    //     },
    // })
    //const data = await res.json()

    //return Response.json({ data })
    return Response.json({ message: "hello world" })
}