import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('Production Exception Masking Verification', () => {
  let filter: AllExceptionsFilter;
  let mockHttpAdapter: any;

  beforeEach(() => {
    mockHttpAdapter = {
      getRequestUrl: jest.fn().mockReturnValue('/api/test'),
      getRequestMethod: jest.fn().mockReturnValue('GET'),
      reply: jest.fn(),
    };

    const mockHttpAdapterHost = {
      httpAdapter: mockHttpAdapter,
    };

    filter = new AllExceptionsFilter(mockHttpAdapterHost as any);
    jest.clearAllMocks();
  });

  it('should MASK internal database error messages when NODE_ENV=production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const dbException = new Error('PrismaClientKnownRequestError: Table `users` does not exist');
    const mockHost = {
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as any;

    filter.catch(dbException, mockHost);

    expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        statusCode: 500,
        message: 'An unexpected internal server error occurred.',
      }),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should PASSTHROUGH explicit NestJS HttpException messages even in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const httpException = new HttpException('Invalid email or password', HttpStatus.BAD_REQUEST);
    const mockHost = {
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as any;

    filter.catch(httpException, mockHost);

    expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid email or password',
      }),
      HttpStatus.BAD_REQUEST,
    );

    process.env.NODE_ENV = originalEnv;
  });
});
