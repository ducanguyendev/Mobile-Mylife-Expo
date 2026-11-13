const fs = require('node:fs');
const crypto = require('node:crypto');
const { createM3Runtime } = require('../tests/helpers/load-m3.cjs');
const runtime = JSON.parse(fs.readFileSync('.tmp/m3-runtime.json', 'utf8'));
if (!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database) || new URL(runtime.api).hostname !== '127.0.0.1') throw Error('Disposable native runtime required');
async function main() {
  const client = createM3Runtime(runtime.api);
  const email = `m6.native.${Date.now()}@gmail.com`;
  const password = 'M6_Qa!' + crypto.randomBytes(16).toString('hex');
  await client.auth.registerRequest({ fullName: 'Synthetic Calendar Tester', phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '1995-05-20', email, password, confirmPassword: password });
  await client.context().login(email, password, false);
  const { toFamilyInput } = client.load('src/features/family/validation/familyValidation.ts');
  const { anniversaryApi } = client.load('src/features/anniversaries/anniversary-api.ts');
  const { familyMapApi } = client.load('src/features/family/map/map-api.ts');
  const { timelineApi } = client.load('src/features/timeline/timeline-api.ts');
  const { blankWrite } = client.load('src/features/timeline/timeline-data.ts');
  const { vietnamDateKey } = client.load('src/features/home/home-data.ts');
  const form = { fullName: '', generation: '1', gender: 'male', dateOfBirth: '', lifeStatus: 'LIVING', deathDate: '', role: '', address: '', phoneNumber: '', facebookUrl: '', instagramUrl: '', biography: '', fatherId: '', motherId: '', spouseId: '', childIds: [] };
  const members = [];
  for (let index = 0; index < 125; index++) {
    const deceased = index < 105;
    const name = index === 104 ? 'Nguyễn Đặng Người Giỗ Thử Nghiệm Có Tên Rất Dài'
      : index === 124 ? 'Nguyễn Đặng Gia Đình Thử Nghiệm Có Tên Rất Dài' : `Synthetic Calendar Member ${String(index + 1).padStart(3, '0')}`;
    const member = await client.family.create(toFamilyInput({ ...form, fullName: name,
      generation: String(1 + Math.floor(index / 45)), dateOfBirth: index === 0 ? '1940-02-29' : index === 1 ? '1970-05-20' : '',
      lifeStatus: deceased ? 'DECEASED' : 'LIVING', deathDate: deceased ? index === 0 ? '2023-03-22' : '2024-02-10' : '',
      fatherId: index >= 45 && index < 90 ? String(members[0].id) : '',
    }));
    members.push(member);
    if (index < 3) await familyMapApi.update(member.id, { latitude: [10.5, 16.1, 21.1][index], longitude: [106.5, 108.1, 105.1][index], displayName: 'Synthetic Calendar QA location ' + (index + 1) });
  }
  const today = vietnamDateKey(new Date());
  for (let index = 0; index < 120; index++) {
    await anniversaryApi.create({ eventType: 'FAMILY_EVENT', title: index === 0
      ? 'Kỷ niệm Nguyễn Đặng – Hành trình gia đình thử nghiệm với tiêu đề dài để kiểm tra lịch trên màn hình nhỏ'
      : `Synthetic Calendar Anniversary ${String(index + 1).padStart(3, '0')}`,
      relatedMemberId: members[index % members.length].id, originalSolarDate: index === 0 ? '2000-' + today.slice(5)
        : `2000-${String(index % 12 + 1).padStart(2, '0')}-${String(index % 27 + 1).padStart(2, '0')}`,
      lunarDay: null, lunarMonth: null, lunarYear: null, isLeapMonth: false,
      place: 'Synthetic anniversary place', host: 'Synthetic host',
      notes: index === 0 ? 'Nội dung giả lập phục vụ kiểm tra lịch và ghi chú dài. '.repeat(30) : 'Synthetic QA only',
    });
  }
  for (let index = 0; index < 10; index++) {
    await anniversaryApi.create({ eventType: 'DEATH_ANNIVERSARY', title: `Synthetic Memorial ${String(index + 1).padStart(3, '0')}`,
      relatedMemberId: members[index].id, originalSolarDate: members[index].deathDate,
      lunarDay: 1, lunarMonth: index === 0 ? 2 : 1, lunarYear: index === 0 ? 2023 : 2024,
      isLeapMonth: index === 0, place: 'Synthetic commemoration place', host: 'Synthetic host', notes: 'Synthetic memorial only' });
  }
  for (let index = 0; index < 10; index++) await timelineApi.create({ ...blankWrite(members[index].id, 'MEMORY'), title: 'Synthetic M6 Timeline Event ' + index, eventYear: 1990 + index });
  const anniversaries = await anniversaryApi.list(), timeline = await timelineApi.list();
  fs.writeFileSync('.tmp/m6-native-user.json', JSON.stringify({ email, password, api: runtime.api, members: members.map(m => m.id), anniversaries: anniversaries.map(a => a.id), originalAnniversaryCount: anniversaries.length, today }));
  fs.mkdirSync('docs/review-m6/test-results/native', { recursive: true });
  fs.writeFileSync('docs/review-m6/test-results/native/synthetic-data.json', JSON.stringify({ syntheticOnly: true, members: members.length, eligibleDeceasedMembers: 105, anniversaries: anniversaries.length, familyEvents: 120, deathAnniversaries: 10, timelineEvents: timeline.length, today, todayEvents: anniversaries.filter(a => a.daysUntil === 0).length }, null, 2));
  console.log('Seeded125 synthetic members,130 anniversaries and ' + timeline.length + ' Timeline events. Credentials are ignored.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
