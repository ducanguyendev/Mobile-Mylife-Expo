export type FamilyMember = {
  id: number;
  fullName: string;
  generation: number;
  gender: string | null;
  dateOfBirth: string | null;
  lifeStatus: 'LIVING' | 'DECEASED';
  deathDate: string | null;
  role: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  locationDisplayName: string | null;
  locationSource: 'GEOCODED' | 'MANUAL' | null;
  locationStatus: 'NO_ADDRESS' | 'PENDING' | 'LOCATED' | 'FAILED' | 'UNAVAILABLE';
  phoneNumber: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  avatarUrl: string | null;
  hasManagedAvatar: boolean;
  biography: string | null;
  fatherId: number | null;
  fatherName: string | null;
  motherId: number | null;
  motherName: string | null;
  spouseId: number | null;
  spouseName: string | null;
  childIds: number[];
  childNames: string[];
  horizontalRelations: { memberId: number; relationType: string }[];
  createdAt: string;
  updatedAt: string;
};

export type Generation = { id: number; name: string; title: string | null; description: string | null };

export type HorizontalRelation = { memberId: number; relationType: string };

export type FamilyMemberInput = {
  fullName: string;
  generation: number;
  gender: string | null;
  dateOfBirth: string | null;
  lifeStatus: 'LIVING' | 'DECEASED';
  deathDate: string | null;
  role: string | null;
  address: string | null;
  phoneNumber: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  biography: string | null;
  fatherId: number | null;
  motherId: number | null;
  spouseId: number | null;
  childIds: number[];
  // Omitted/null preserves existing relations; an explicit empty array clears them.
  horizontalRelations?: { memberId: number; relationType: string }[] | null;
};

export type FamilyMemberWriteInput = Omit<FamilyMemberInput, 'childIds'> & { childIds?: number[] | null };
