import { NextResponse } from 'next/server';
import { CLIENT_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Client signed out successfully.',
  });

  response.cookies.set({
    name: CLIENT_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.delete(CLIENT_COOKIE_NAME);

  return response;
}
