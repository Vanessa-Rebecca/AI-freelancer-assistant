// The user object the API returns (mirrors publicUserSelect in apps/api).
// Dates arrive as ISO strings over JSON.
export type PublicUser = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  aiCredits: number;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  profile: { fullName: string; avatarUrl: string | null } | null;
};

export type AuthResponse = { user: PublicUser; accessToken: string };
