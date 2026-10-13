import { ConflictException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Task } from './entities/task.entity'
import { User } from '../auth/entities/user.entity'

@Injectable()
export class TodoService {
    private readonly logger = new Logger(TodoService.name)
    
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(User)
        private readonly userRespository: Repository<User>,
    ) {}

    listTasks(user_id: string) {
        try {
            return this.taskRepository.find({ where: { user: { id: user_id } } })
        } catch (error) { 
            this.logger.error(error)
            throw new InternalServerErrorException('Failed to list tasks')
        }
    }

    async createTask(user_id: string, title: string, description: string | null, deadline: Date | null, color_code: string | null) {
        try {
            const task = new Task()
            const user = await this.userRespository.findOne({ where: { id: user_id } })

            if (!user) {
                throw new ConflictException('User not found')
            }

            task.user = user
            task.title = title
            task.description = description
            task.deadline = deadline
            task.color_code = color_code

            await this.taskRepository.save(task)
            return task.id
        } catch (error) {
            this.logger.error(error)

            if (error instanceof ConflictException) {
                throw error
            }

            throw new InternalServerErrorException('Failed to create task')
        }
    }

    async updateTask(user_id: string, task_id: string, title: string, description: string | null, deadline: Date | null, completed: boolean, color_code: string | null) {
        try {
            const task = await this.taskRepository.findOne({ where: { id: task_id, user: { id: user_id } }})

            if (!task) {
                throw new UnauthorizedException('Task not found or user not authorized')
            }

            await this.taskRepository.update({ id: task_id}, { title, description, deadline, completed, color_code })

            return task_id
        } catch (error) {
            this.logger.error(error)

            if (error instanceof UnauthorizedException) {
                throw error
            }

            throw new InternalServerErrorException('Failed to update task')
        }
    }

    async markComplete(user_id: string, task_id: string, completed: boolean) {
        try {
            const task = await this.taskRepository.findOne({ where: { id: task_id, user: { id: user_id } }})

            if (!task) {
                throw new UnauthorizedException('Task not found or user not authorized')
            }

            await this.taskRepository.update({ id: task_id, user: { id: user_id } }, { completed: completed })

            return task_id
        } catch (error) {         
            this.logger.error(error)

            if (error instanceof UnauthorizedException) {
                throw error
            }

            throw new InternalServerErrorException('Failed to update task')
        }
    }

    async deleteTask(user_id: string, task_id: string) {
        try {
            const task = await this.taskRepository.findOne({ where: { id: task_id, user: { id: user_id } }})

            if (!task) {
                throw new UnauthorizedException('Task not found or user not authorized')
            }

            await this.taskRepository.delete({ id: task_id, user: { id: user_id } })

            return task_id
        } catch (error) {         
            this.logger.error(error)

            if (error instanceof UnauthorizedException) {
                throw error
            }

            throw new InternalServerErrorException('Failed to delete task')
        }
    }
}
