import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    hasAppwriteEndpoint: !!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    hasAppwriteProject: !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    hasAppwriteApiKey: !!process.env.APPWRITE_API_KEY,
    hasResendApiKey: !!process.env.RESEND_API_KEY,
    hasDatabaseId: !!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    nodeEnv: process.env.NODE_ENV,
  }
  
  return NextResponse.json(envVars)
}
