import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

describe('AuthController', () => {
  let controller: AuthController
  let authService: any

  beforeEach(async () => {
    authService = {
      createUser: jest.fn(),
      loginUser: jest.fn(),
      resetPassword: jest.fn(),
      refreshToken: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should call authService.resetPassword', async () => {
    const dto = {
      username: 'testuser',
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    }
    authService.resetPassword.mockResolvedValue({ message: 'Password reset successfully' })

    const result = await controller.resetPassword(dto)
    expect(authService.resetPassword).toHaveBeenCalledWith(dto)
    expect(result).toEqual({ message: 'Password reset successfully' })
  })
})
