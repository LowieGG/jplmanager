import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  await connectDB();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json({ message: 'Email bestaat al' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({ name, email, password: hashedPassword });

  return NextResponse.json({ message: 'Gebruiker aangemaakt' }, { status: 201 });
}
