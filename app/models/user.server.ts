// import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";

import type { WithId } from "mongodb";
import { ObjectId } from "mongodb";
import { Collection } from "~/db.server";

// import { prisma } from "~/db.server";

// export type { User } from "@prisma/client";

export type User = {
  // _id: string
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const Users = new Collection<User>("users");

// small database request used in health check
export async function getUserCount(): Promise<number> {
  return await Users.collection.countDocuments();
}

export type SerializedUser = Omit<User, "password"> & { id: string };

const serializeUser = (
  user: WithId<
    User & {
      createdAt: Date;
      updatedAt: Date;
    }
  > | null,
): SerializedUser | null => {
  if (!user) {
    return null;
  }

  const { password, _id, ...userWithoutPassword } = user;
  return {
    id: _id.toString(),
    ...userWithoutPassword,
  };
};

export async function getUserById(
  id: string | ObjectId,
): Promise<SerializedUser | null> {
  return serializeUser(await Users.findOne({ _id: new ObjectId(id) }));
}

export async function getUserByEmail(
  email: User["email"],
): Promise<SerializedUser | null> {
  return serializeUser(await Users.findOne({ email }));
}

export async function createUser(
  email: User["email"],
  password: string,
): Promise<string> {
  const hashedPassword = await bcrypt.hash(password, 10);

  const { insertedId } = await Users.insertOne({
    email,
    password: hashedPassword,
  });
  return insertedId.toString();
}

export async function deleteUserByEmail(email: User["email"]) {
  return await Users.collection.deleteOne({ email });
}

export async function verifyLogin(
  email: User["email"],
  password: User["password"],
): Promise<SerializedUser | null> {
  const user = await Users.findOne({ email });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return null;
  }

  return serializeUser(user);
}
