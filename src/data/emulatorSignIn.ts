import {
  GoogleAuthProvider,
  signInWithCredential,
  type Auth,
} from "firebase/auth";

// Dynamically imported only by localhost e2e builds; absent from production.
export function exposeTestSignIn(auth: Auth) {
  Object.assign(window, {
    __signInTestUser: async (id: string) => {
      const token = JSON.stringify({
        sub: id,
        email: `${id}@example.test`,
        email_verified: true,
      });
      await signInWithCredential(auth, GoogleAuthProvider.credential(token));
    },
  });
}
