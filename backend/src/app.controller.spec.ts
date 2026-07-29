import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prismaService: Pick<PrismaService, '$queryRaw'>;

  beforeEach(async () => {
    prismaService = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API status', () => {
      expect(appController.getRoot()).toEqual({
        name: 'ecommerce-devsecops-api',
        status: 'ok',
      });
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = appController.getHealth();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toEqual(expect.any(String));
    });
  });

  describe('version', () => {
    it('should return deployment metadata', () => {
      const result = appController.getVersion();

      expect(result.name).toBe('ecommerce-devsecops-api');
      expect(result.environment).toEqual(expect.any(String));
      expect(result.commitSha).toEqual(expect.any(String));
      expect(result.builtAt).toEqual(expect.any(String));
    });
  });

  describe('health details', () => {
    it('should return dependency health checks', async () => {
      const result = await appController.getHealthDetails();

      expect(prismaService.$queryRaw).toHaveBeenCalled();
      expect(result.status).toBe('ok');
      expect(result.checks.database).toBe('ok');
      expect(result.latencyMs.database).toEqual(expect.any(Number));
    });
  });
});
