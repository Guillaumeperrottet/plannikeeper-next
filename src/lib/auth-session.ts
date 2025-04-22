import { auth } from "./auth";
import { headers } from "next/headers";

export const getUser = async () => {
  const session = await auth.api.getSession({ headers: await headers (),
  });

  return session?.user;
};

export const getRquiredeUser = async () => {
  const user = await getUser();

  if (!user) {
    throw new Error("User not found");
  };

  return user;
};
