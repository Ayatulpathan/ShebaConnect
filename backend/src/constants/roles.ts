export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  INDIVIDUAL_PROVIDER: 'INDIVIDUAL_PROVIDER',
  COMPANY_OWNER: 'COMPANY_OWNER',
  COMPANY_STAFF: 'COMPANY_STAFF',
  TECHNICIAN: 'TECHNICIAN',
  ADMIN: 'ADMIN',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ALL_ROLES: UserRole[] = Object.values(USER_ROLES);

// Only these roles can be chosen during public self-registration
export const PUBLIC_REGISTRATION_ROLES: UserRole[] = [
  USER_ROLES.CUSTOMER,
  USER_ROLES.INDIVIDUAL_PROVIDER,
  USER_ROLES.COMPANY_OWNER,
];
