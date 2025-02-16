import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuth } from '../context/auth';

export async function authenticatedFetch(url, options = {}) {
 const session = await fetchAuthSession();
 const accessToken=session.tokens.accessToken.toString()
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}