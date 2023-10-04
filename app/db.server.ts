import type {
  BulkWriteOptions,
  Document,
  Filter,
  FindOptions,
  InsertOneOptions,
  OptionalUnlessRequiredId,
  Collection as TCollection,
  UpdateFilter,
  UpdateOptions,
} from "mongodb";
import { MongoClient } from "mongodb";
import { singleton } from "./singleton.server";

const { MONGODB_CONNECTION_STRING, MONGODB_DATABASE } = process.env;
if (!MONGODB_CONNECTION_STRING || !MONGODB_DATABASE) {
  throw new Error(
    "Please define the MONGODB_CONNECTION_STRING and/or MONGODB_DATABASE environment variable inside .env",
  );
}

// ensure an appName is set on the connection string. Helpful for debugging in Atlas.
const connectionString = !MONGODB_CONNECTION_STRING.includes("appName")
  ? MONGODB_CONNECTION_STRING.includes("?")
    ? `${MONGODB_CONNECTION_STRING}&appName=remix`
    : `${MONGODB_CONNECTION_STRING}?appName=remix`
  : MONGODB_CONNECTION_STRING;

const mongodb = singleton("mongodb", () => new MongoClient(connectionString));

process.on("exit", () => {
  console.info("EXIT - MongoDB Client disconnecting");
  mongodb.close();
});

type WithTimeStamps<T> = T extends { createdAt: Date; updatedAt: Date }
  ? T
  : T & {
      createdAt: Date;
      updatedAt: Date;
    };

export class Collection<T extends Document> {
  collection: TCollection<WithTimeStamps<T>>;

  constructor(collectionName: string) {
    const db = mongodb.db(MONGODB_DATABASE);
    this.collection = db.collection<WithTimeStamps<T>>(collectionName);
  }

  insertOne = async (
    doc: OptionalUnlessRequiredId<T>,
    options?: InsertOneOptions,
  ) => {
    return await this.collection.insertOne(
      // @ts-expect-error, this is fine
      {
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      options,
    );
  };

  insertMany = async (
    docs: OptionalUnlessRequiredId<WithTimeStamps<T>>[],
    options?: BulkWriteOptions,
  ) => {
    return await this.collection.insertMany(
      docs.map((doc) => ({
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      options,
    );
  };

  updateOne = async (
    filter: Filter<WithTimeStamps<T>>,
    update: UpdateFilter<WithTimeStamps<T>> | Partial<WithTimeStamps<T>>,
    options?: UpdateOptions,
  ) => {
    let _update = update;
    if (update.$set) {
      if (options?.upsert && update.$setOnInsert) {
        _update.$setOnInsert = {
          ...(update.$setOnInsert && { ...update.$setOnInsert }),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        _update.$set = {
          ...update.$set,
          updatedAt: new Date(),
        };
      }
    }
    return await this.collection.updateOne(filter, _update, options);
  };

  updateMany = async (
    filter: Filter<WithTimeStamps<T>>,
    update: UpdateFilter<WithTimeStamps<T>> | Partial<WithTimeStamps<T>>,
    options?: UpdateOptions,
  ) => {
    let _update = update;
    if (update.$set) {
      if (options?.upsert && update.$setOnInsert) {
        _update.$setOnInsert = {
          ...(update.$setOnInsert && { ...update.$setOnInsert }),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        _update.$set = {
          ...update.$set,
          updatedAt: new Date(),
        };
      }
    }
    return await this.collection.updateOne(filter, _update, options);
  };
  findOne = async (filter: Filter<WithTimeStamps<T>>) =>
    this.collection.findOne(filter);
  find = async (filter: Filter<WithTimeStamps<T>>, options?: FindOptions) =>
    this.collection.find(filter, options);
}

export { mongodb };
