import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    isAdmin: boolean;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      isAdmin: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    phone: string;
    isAdmin: boolean;
  }
}
