import { BadRequestException, ConflictException, UnauthorizedException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from './entities/user.entity'
import { ResetPasswordDto } from './dto/reset-password.dto'

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name)
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService
    ) {}

    async createUser(username: string, password: string) {
        try {
            const existingUser = await this.userRepository.findOne({ where: { username } })
            
            if (existingUser) { 
                throw new ConflictException('User already exists')
            }

            const user = new User()
            user.username = username
            user.password = await bcrypt.hash(password, 10)

            await this.userRepository.save(user)

            return user.id
        } catch (error) {
            this.logger.error(error)
            
            if (error instanceof ConflictException) {
                throw error
            }

            throw new InternalServerErrorException('Failed to create user')
        }
    }

    async loginUser(username: string, password: string) {
        try {
            const user = await this.userRepository.findOne({ where: { username } })
            
            if (!user) {
                throw new UnauthorizedException('User does not exist')
            }

            const isPasswordValid = await bcrypt.compare(password, user.password)
            
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials')
            }

            const payload = { username: user.username, sub: user.id }

            return {
                access_token: await this.jwtService.signAsync({ ...payload, type: 'access_token' }, { expiresIn: '30m' }),
                refresh_token: await this.jwtService.signAsync({ ...payload, type: 'refresh_token' }, { expiresIn: '1d' })
            }

        } catch (error) {
            this.logger.error(error)
            
            if (error instanceof UnauthorizedException) {
                throw error
            }

            throw new InternalServerErrorException('Failed to login user')
        }
    }

    async refreshToken(token: string) {
        try {
            const payload = await this.jwtService.verifyAsync(token.replace('Bearer ', ''))
            
            if (payload.type !== 'refresh_token') {
                throw new UnauthorizedException('Invalid token type')
            }

            const user = await this.userRepository.findOne({ where: { id: payload.sub } })
            
            if (!user) {
                throw new UnauthorizedException('User does not exist')
            }

            return {
                access_token: await this.jwtService.signAsync({ username: user.username, sub: user.id, type: 'access_token' }, { expiresIn: '30m' })
            }

        } catch (error) {
            this.logger.error(error)
            
            if (error instanceof UnauthorizedException) {
                throw error
            }

            throw new InternalServerErrorException('Failed to refresh token')
        }
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        try {
            const { username, currentPassword, password, newPassword } = resetPasswordDto
            const activeCurrentPassword = currentPassword || password

            if (!activeCurrentPassword) {
                throw new BadRequestException('Current password is required')
            }

            const user = await this.userRepository.findOne({ where: { username } })

            if (!user) {
                throw new UnauthorizedException('User does not exist')
            }

            const isPasswordValid = await bcrypt.compare(activeCurrentPassword, user.password)

            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials')
            }

            user.password = await bcrypt.hash(newPassword, 10)
            await this.userRepository.save(user)

            return {
                message: 'Password reset successfully'
            }
        } catch (error) {
            this.logger.error(error)

            if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
                throw error
            }

            throw new InternalServerErrorException('Failed to reset password')
        }
    }

    async checkUserExists(id: string) {
        try {
            const user = await this.userRepository.findOne({ where: { id: id }})
            return user ? true : false
        } catch (error) {
            this.logger.error(error)
            throw new InternalServerErrorException('Failed to check user')
        }
    }
}
