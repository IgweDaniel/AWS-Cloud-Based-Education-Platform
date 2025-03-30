import { fetchAuthSession } from "aws-amplify/auth";

export async function authenticatedFetch(url, options = {}) {
  const session = await fetchAuthSession();
  //  const accessToken=session.tokens.accessToken.toString()
  const accessToken = session.tokens.idToken.toString();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}
