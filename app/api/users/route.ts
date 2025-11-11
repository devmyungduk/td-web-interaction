import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { logRequest, logInfo, logError } from '@/lib/logger';

type User = { id: string; name: string };
let users: User[] = [
  { id: randomUUID(), name: '댕댕이' },
  { id: randomUUID(), name: '바닷가재' },
];

export async function GET(req: NextRequest) {
  try {
    logRequest(req, 'GET /api/users called');
    logInfo('현재 사용자 수', users.length);
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    logError('GET /api/users error', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    logRequest(req, 'POST /api/users called');
    const data = await req.json();
    const newUser: User = { id: randomUUID(), name: data?.name ?? '무명' };
    users.push(newUser);
    logInfo('신규 사용자 추가', newUser);
    return NextResponse.json({ message: 'User created', data: newUser }, { status: 201 });
  } catch (error) {
    logError('POST /api/users error', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
