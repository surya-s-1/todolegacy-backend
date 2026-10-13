import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { User } from './entities/user.entity'

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation(async (pass: string) => `hashed_${pass}`),
  compare: jest.fn().mockImplementation(async (pass: string, hash: string) => hash === `hashed_${pass}`),
}))

describe('AuthService', () => {
  let service: AuthService
  let userRepository: any

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('resetPassword', () => {
    it('should reset password when username and current password match', async () => {
      const mockHashed = 'hashed_oldPassword123'
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        password: mockHashed,
      }
      userRepository.findOne.mockResolvedValue(mockUser)
      userRepository.save.mockResolvedValue(mockUser)

      const result = await service.resetPassword({
        username: 'testuser',
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      })

      expect(result).toEqual({ message: 'Password reset successfully' })
      expect(userRepository.save).toHaveBeenCalled()
      expect(mockUser.password).toBe('hashed_newPassword123')
    })

    it('should throw UnauthorizedException when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null)

      await expect(
        service.resetPassword({
          username: 'nonexistent',
          currentPassword: 'oldPassword123',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException when current password is wrong', async () => {
      const mockHashed = 'hashed_correctPassword'
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        password: mockHashed,
      }
      userRepository.findOne.mockResolvedValue(mockUser)

      await expect(
        service.resetPassword({
          username: 'testuser',
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException)
    })
  })
})
