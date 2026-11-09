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
  phoneNumber: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  avatarUrl: string | null;
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
};

export type Generation = { id: number; name: string; title: string | null; description: string | null };

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
  horizontalRelations: { memberId: number; relationType: string }[];
};
