import { PrismaClient, RoleName, ApplicationStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed AppConfig for Registration Password
  console.log('Creating AppConfig for REGISTRATION_PASSWORD...');
  const registrationPassword = 'test123test123'; // The actual registration code
  await prisma.appConfig.upsert({
    where: { key: 'REGISTRATION_PASSWORD' },
    update: { value: registrationPassword },
    create: {
      key: 'REGISTRATION_PASSWORD',
      value: registrationPassword,
      notes: 'Fixed password required for initial user registration'
    },
  });
  console.log('AppConfig for REGISTRATION_PASSWORD created/updated successfully');

  // Seed roles
  console.log('Creating roles...');
  const roles = [
    { role_name: RoleName.Admin },
    { role_name: RoleName.Librarian },
    { role_name: RoleName.Member },
    { role_name: RoleName.PotentialMember }
  ];

  for (const role of roles) {
    await prisma.roles.upsert({
      where: { role_name: role.role_name },
      update: {},
      create: role,
    });
  }

  console.log('Roles created successfully');

  // Get roles
  const adminRole = await prisma.roles.findUnique({ where: { role_name: RoleName.Admin } });
  const librarianRole = await prisma.roles.findUnique({ where: { role_name: RoleName.Librarian } });
  const memberRole = await prisma.roles.findUnique({ where: { role_name: RoleName.Member } });
  const potentialMemberRole = await prisma.roles.findUnique({ where: { role_name: RoleName.PotentialMember } });

  if (!adminRole || !librarianRole || !memberRole || !potentialMemberRole) {
    throw new Error('One or more roles not found');
  }

  // Seed sample users
  console.log('Creating sample users...');
  const sampleUsers = [
    {
      username: 'admin',
      name: '관리자',
      email: 'admin@springbooks.com',
      phone_number: '01012345678',
      role_id: adminRole.role_id,
      password: 'Admin123!',  // Updated to match task requirement
      application_status: ApplicationStatus.approved,
      requested_librarian_role_on_application: false,
    },
    {
      username: 'librarian1',
      name: '사서1',
      email: 'librarian1@example.com',
      phone_number: '01023456789',
      role_id: librarianRole.role_id,
      password: 'password123',  // Will be hashed before saving
      application_status: ApplicationStatus.approved,
      requested_librarian_role_on_application: true,
    },
    {
      username: 'member1',
      name: '회원1',
      email: 'member1@example.com',
      phone_number: '01034567890',
      role_id: memberRole.role_id,
      password: 'password123',  // Will be hashed before saving
      application_status: ApplicationStatus.approved,
      requested_librarian_role_on_application: false,
    },
    {
      username: 'member2',
      name: '회원2',
      email: 'member2@example.com',
      phone_number: '01045678901',
      role_id: memberRole.role_id,
      password: 'password123',  // Will be hashed before saving
      application_status: ApplicationStatus.approved,
      requested_librarian_role_on_application: false,
    },
    {
      username: 'potential1',
      name: '신청자1',
      email: 'potential1@example.com',
      phone_number: '01056789012',
      role_id: potentialMemberRole.role_id,
      password: 'password123',  // Will be hashed before saving
      application_status: ApplicationStatus.pending_approval,
      requested_librarian_role_on_application: false,
    }
  ];

  const createdUsers = [];

  for (const user of sampleUsers) {
    const passwordHash = await argon2.hash(user.password);
    const createdUser = await prisma.users.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        password_hash: passwordHash,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role_id: user.role_id,
        application_status: user.application_status,
        requested_librarian_role_on_application: user.requested_librarian_role_on_application,
      },
    });
    createdUsers.push(createdUser);
  }

  console.log('Sample users created successfully');

  // Create board types
  console.log('Creating board types...');
  const boardTypes = [
    { name: '공지사항', description: '관리자가 작성하는 중요 공지사항' },
    { name: '자유게시판', description: '회원들이 자유롭게 소통하는 공간' },
    { name: '독서후기', description: '읽은 책에 대한 후기를 공유하는 공간' }
  ];

  const createdBoardTypes = [];

  for (const boardType of boardTypes) {
    const created = await prisma.boardTypes.upsert({
      where: { name: boardType.name },
      update: {},
      create: boardType,
    });
    createdBoardTypes.push(created);
  }

  console.log('Board types created successfully');

  // Create material types
  console.log('Creating material types...');
  const materialTypes = [
    { name: '문서', description: '워드, PDF 등의 문서 자료' },
    { name: '이미지', description: '사진, 포스터 등의 이미지 자료' },
    { name: '동영상', description: '영상 자료' }
  ];

  const createdMaterialTypes = [];

  for (const materialType of materialTypes) {
    const created = await prisma.materialTypes.upsert({
      where: { name: materialType.name },
      update: {},
      create: materialType,
    });
    createdMaterialTypes.push(created);
  }

  console.log('Material types created successfully');

  // Create sample posts
  console.log('Creating sample posts...');
  const adminUser = createdUsers.find(user => user.username === 'admin');
  const memberUser = createdUsers.find(user => user.username === 'member1');
  
  if (!adminUser || !memberUser) {
    throw new Error('Admin or member user not found');
  }
  
  const noticeBoard = createdBoardTypes.find(board => board.name === '공지사항');
  const freeBoard = createdBoardTypes.find(board => board.name === '자유게시판');
  const reviewBoard = createdBoardTypes.find(board => board.name === '독서후기');
  
  if (!noticeBoard || !freeBoard || !reviewBoard) {
    throw new Error('One or more board types not found');
  }

  const samplePosts = [
    {
      board_type_id: noticeBoard.board_type_id,
      user_id: adminUser.user_id,
      title: '영어 원서 읽기 동아리 Spring 홈페이지 오픈 안내',
      content: '안녕하세요, 회원 여러분. 영어 원서 읽기 동아리 Spring의 홈페이지가 오픈되었습니다. 앞으로 많은 이용 바랍니다.',
      is_notice: true,
    },
    {
      board_type_id: freeBoard.board_type_id,
      user_id: memberUser.user_id,
      title: '가입 인사 드립니다',
      content: '안녕하세요! 영어 원서 읽기에 관심이 많아 가입했습니다. 잘 부탁드립니다!',
      is_notice: false,
    },
    {
      board_type_id: reviewBoard.board_type_id,
      user_id: memberUser.user_id,
      title: 'The Great Gatsby 독서 후기',
      content: 'The Great Gatsby는 1920년대 미국을 배경으로 한 소설로...(이하 생략)...매우 인상 깊었습니다.',
      is_notice: false,
    }
  ];

  for (const post of samplePosts) {
    await prisma.posts.create({
      data: post
    });
  }

  console.log('Sample posts created successfully');

  // Create sample materials
  console.log('Creating sample materials...');
  const documentType = createdMaterialTypes.find(type => type.name === '문서');
  const imageType = createdMaterialTypes.find(type => type.name === '이미지');
  
  if (!documentType || !imageType) {
    throw new Error('Material types not found');
  }

    for (const material of [    {      title: '2024년 독서 목록',      description: '2024년에 함께 읽을 책 목록입니다.',      file_url: 'https://example.com/files/reading-list-2024.pdf',      file_size_kb: 245,      original_file_name: 'reading-list-2024.pdf',      material_type_id: documentType.material_type_id,      uploaded_by_id: adminUser.user_id,    },    {      title: '독서 모임 사진',      description: '지난 주 독서 모임에서 찍은 사진입니다.',      file_url: 'https://example.com/files/book-club-photo.jpg',      file_size_kb: 1024,      original_file_name: 'book-club-photo.jpg',      material_type_id: imageType.material_type_id,      uploaded_by_id: memberUser.user_id,    }  ]) {
    await prisma.materials.create({
      data: material
    });
  }

  console.log('Sample materials created successfully');

  // Create sample schedules (events)
  console.log('Creating sample schedules...');
  const now = new Date();
  const librarian = createdUsers.find(user => user.username === 'librarian1');
  
  for (const schedule of [
    {
      title: '3월 독서 모임',
      description: '이번 달에는 The Great Gatsby를 함께 읽고 토론합니다.',
      start_time: new Date(now.getFullYear(), now.getMonth(), 15, 14, 0),
      end_time: new Date(now.getFullYear(), now.getMonth(), 15, 16, 0),
      start_datetime: new Date(now.getFullYear(), now.getMonth(), 15, 14, 0),
      end_datetime: new Date(now.getFullYear(), now.getMonth(), 15, 16, 0),
      location: '서울시 강남구 스터디룸 A',
      created_by_id: adminUser.user_id,
    },
    {
      title: '신간 책 소개 세션',
      description: '이번 달에 출간된 영어 원서를 소개하는 시간입니다.',
      start_time: new Date(now.getFullYear(), now.getMonth(), 20, 19, 0),
      end_time: new Date(now.getFullYear(), now.getMonth(), 20, 21, 0),
      start_datetime: new Date(now.getFullYear(), now.getMonth(), 20, 19, 0),
      end_datetime: new Date(now.getFullYear(), now.getMonth(), 20, 21, 0),
      location: '온라인 Zoom 미팅',
      created_by_id: librarian?.user_id || adminUser.user_id,
    }
  ]) {
    await prisma.schedules.create({
      data: schedule
    });
  }

  console.log('Sample schedules created successfully');

  // Create sample chat messages (Sudabang)
  console.log('Creating sample chat messages...');
  const sampleMessages = [
    {
      user_id: memberUser.user_id,
      content: '다음 모임은 언제인가요?',
    },
    {
      user_id: createdUsers.find(user => user.username === 'librarian1')?.user_id || adminUser.user_id,
      content: '다음 모임은 이번 달 15일 14시입니다. 많은 참여 바랍니다!',
    },
    {
      user_id: createdUsers.find(user => user.username === 'member2')?.user_id || memberUser.user_id,
      content: '지난 모임에서 나눠주신 자료 링크 다시 공유해주실 수 있나요?',
    }
  ];

  for (const message of sampleMessages) {
    await prisma.sudabangMessages.create({
      data: message
    });
  }

  console.log('Sample chat messages created successfully');

  // Create sample comments
  console.log('Creating sample comments...');
  
  // Get first post and chat message for comments
  const firstPost = await prisma.posts.findFirst({
    where: { title: '가입 인사 드립니다' }
  });
  
  const firstChatMessage = await prisma.sudabangMessages.findFirst();

  if (firstPost && firstChatMessage) {
    const sampleComments = [
      {
        user_id: adminUser.user_id,
        parent_post_id: firstPost.post_id,
        parent_sudabang_message_id: null,
        content: '환영합니다! 앞으로 함께 즐거운 독서 활동해요.',
      },
      {
        user_id: createdUsers.find(user => user.username === 'member2')?.user_id || memberUser.user_id,
        parent_post_id: null,
        parent_sudabang_message_id: firstChatMessage.message_id,
        content: '저도 궁금했어요. 감사합니다!',
      }
    ];

    for (const comment of sampleComments) {
      await prisma.comments.create({
        data: comment
      });
    }

    console.log('Sample comments created successfully');
  } else {
    console.log('Skipping comments: post or chat message not found');
  }

  // Create sample read books
  console.log('Creating sample read books...');
  const sampleBooks = [
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      cover_image_url: 'https://example.com/covers/great-gatsby.jpg',
      description: '1920년대 미국을 배경으로 하는 소설로, 제이 개츠비의 부와 사랑, 그리고 아메리칸 드림에 관한 이야기.',
      date_read: new Date(2023, 11, 15), // 2023년 12월 15일
      added_by_user_id: adminUser.user_id,
    },
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      cover_image_url: 'https://example.com/covers/to-kill-mockingbird.jpg',
      description: '1930년대 미국 남부를 배경으로 한 소설로, 인종차별과 정의에 관한 이야기.',
      date_read: new Date(2024, 0, 20), // 2024년 1월 20일
      added_by_user_id: adminUser.user_id,
    }
  ];

  for (const book of sampleBooks) {
    await prisma.readBooks.create({
      data: book
    });
  }

  console.log('Sample read books created successfully');

  // Create introduction content
  console.log('Creating introduction content...');
  const introContent = [
    {
      section_key: 'club_introduction',
      content_value: '영어 원서 읽기 동아리 Spring은 2020년에 설립된 독서 모임으로, 다양한 장르의 영어 원서를 함께 읽고 토론하는 활동을 하고 있습니다. 매월 한 권의 책을 선정하여 읽고, 정기 모임에서 의견을 나누고 있습니다.',
    },
    {
      section_key: 'activities',
      content_value: '1. 월 1회 오프라인 독서 모임\n2. 분기별 저자 특강 및 워크숍\n3. 연 2회 영어 원서 독서 챌린지\n4. 온라인 독서 토론 포럼 운영',
    }
  ];

  for (const intro of introContent) {
    await prisma.introductionContent.upsert({
      where: { section_key: intro.section_key },
      update: { content_value: intro.content_value },
      create: intro,
    });
  }

  console.log('Introduction content created successfully');
  console.log('All seed data created successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 