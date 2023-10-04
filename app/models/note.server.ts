// import type { User, Note } from "@prisma/client";

import type { WithId } from "mongodb";
import { ObjectId } from "mongodb";
import { Collection } from "~/db.server";

// import { prisma } from "~/db.server";

type NoteDocument = {
  title: string;
  body: string;

  createdAt?: Date;
  updatedAt?: Date;
  userId: ObjectId;
};

const Notes = new Collection<NoteDocument>("notes");

type SerializedNote = Omit<NoteDocument, "userId"> & {
  id: string;
  userId: string;
};

const serializeNote = (
  note: WithId<
    NoteDocument & {
      createdAt: Date;
      updatedAt: Date;
    }
  > | null,
): SerializedNote | null => {
  if (!note) {
    return null;
  }

  const { _id, userId, ...noteWithoutUserId } = note;
  return {
    id: _id.toString(),
    userId: userId.toString(),
    ...noteWithoutUserId,
  };
};

export async function getNote(
  id: string | ObjectId,
): Promise<SerializedNote | null> {
  return serializeNote(await Notes.findOne({ _id: new ObjectId(id) }));
}

export async function getNoteListItems({
  userId,
}: {
  userId: string | ObjectId;
}): Promise<SerializedNote[]> {
  const notes = await (
    await Notes.find({ userId: new ObjectId(userId) })
  ).toArray();
  return notes.map(serializeNote) as SerializedNote[];
}

export async function createNote({
  body,
  title,
  userId,
}: Pick<NoteDocument, "body" | "title"> & {
  userId: string | ObjectId;
}): Promise<string> {
  const { insertedId } = await Notes.insertOne({
    body,
    title,
    userId: new ObjectId(userId),
  });
  return insertedId.toString();
}

export async function deleteNote(id: ObjectId | string): Promise<void> {
  await Notes.collection.deleteOne({ _id: new ObjectId(id) });
}
