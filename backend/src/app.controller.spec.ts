import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
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
});
