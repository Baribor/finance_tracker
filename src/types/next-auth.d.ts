import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    id: string;
    group: string | null;
    mustChangePassword: boolean;
    serviceStatus: string;
    serviceCompletedAt: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      group: string | null;
      mustChangePassword: boolean;
      serviceStatus: string;
      serviceCompletedAt: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    id: string;
    group: string | null;
    mustChangePassword: boolean;
    serviceStatus: string;
    serviceCompletedAt: string | null;
  }
}
