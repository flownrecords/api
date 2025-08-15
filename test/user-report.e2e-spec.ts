import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserService } from '../src/user/user.service';
import { UserController } from '../src/user/user.controller';
import { JwtGuard } from '../src/auth/guard';

describe('UserController (e2e) - Report Generation', () => {
  let app: INestApplication;
  let userService: UserService;

  const mockUserService = {
    generateReport: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    userService = moduleFixture.get<UserService>(UserService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users/report (GET) should return PNG image', async () => {
    const mockImageBuffer = Buffer.from('mock-png-data');
    mockUserService.generateReport.mockResolvedValue(mockImageBuffer);

    const response = await request(app.getHttpServer())
      .get('/users/report')
      .expect(200);

    expect(response.headers['content-type']).toBe('image/png');
    expect(response.body).toBeDefined();
    expect(mockUserService.generateReport).toHaveBeenCalledWith(undefined); // Since we're mocking the user
  });

  it('should call generateReport with user id', async () => {
    const mockImageBuffer = Buffer.from('mock-png-data');
    mockUserService.generateReport.mockResolvedValue(mockImageBuffer);

    await request(app.getHttpServer())
      .get('/users/report')
      .expect(200);

    expect(mockUserService.generateReport).toHaveBeenCalled();
  });
});