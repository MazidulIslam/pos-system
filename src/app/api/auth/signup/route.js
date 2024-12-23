import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { email, password } = await req.json();
  const { db, client } = await connectToDatabase();

  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await db.collection("users").findOne({ email });
  if (existingUser) {
    await disconnectFromDatabase(client);
    return new Response("Email already exists", { status: 400 });
  }

  await db.collection("users").insertOne({
    email,
    password: hashedPassword,
    createdAt: new Date(),
  });

  await disconnectFromDatabase(client);

  return new Response("User registered successfully", { status: 201 });
}
