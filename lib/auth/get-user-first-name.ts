type SupabaseLikeUser = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function normalizeFirstToken(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const firstToken = trimmed.split(/\s+/)[0]?.trim();
  if (!firstToken) {
    return null;
  }

  return firstToken;
}

function titleCase(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function firstNameFromMetadata(
  userMetadata: Record<string, unknown> | null | undefined
): string | null {
  if (!userMetadata) {
    return null;
  }

  const directKeys = ["first_name", "given_name", "firstName", "preferred_name"];
  for (const key of directKeys) {
    const candidate = userMetadata[key];
    if (typeof candidate === "string") {
      const normalized = normalizeFirstToken(candidate);
      if (normalized) {
        return normalized;
      }
    }
  }

  const fullNameKeys = ["full_name", "name", "display_name"];
  for (const key of fullNameKeys) {
    const candidate = userMetadata[key];
    if (typeof candidate === "string") {
      const normalized = normalizeFirstToken(candidate);
      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
}

function firstNameFromEmail(email?: string | null): string | null {
  if (!email) {
    return null;
  }

  const localPart = email.split("@")[0]?.trim();
  if (!localPart) {
    return null;
  }

  const preferredSegment = localPart.split(/[._+\-]/)[0]?.trim();
  const normalized = normalizeFirstToken(preferredSegment ?? localPart);

  return normalized ? titleCase(normalized) : null;
}

export function getUserFirstName(user: SupabaseLikeUser | null | undefined): string {
  const fromMetadata = firstNameFromMetadata(user?.user_metadata);
  if (fromMetadata) {
    return fromMetadata;
  }

  const fromEmail = firstNameFromEmail(user?.email);
  if (fromEmail) {
    return fromEmail;
  }

  return "Member";
}
