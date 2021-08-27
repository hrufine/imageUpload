import { EntityRepository, Repository } from "typeorm";
import { Task } from "./task.enitity";
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { GetTasksFilterDto } from "./dto/get-task-filter.dto";
import { User } from '../auth/user.entity';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import { use } from "passport";

@EntityRepository(Task)
export class TaskRepository extends Repository<Task>{
    private logger = new Logger('TaskRepository',{timestamp:true})
    async getTasks(filterDto: GetTasksFilterDto,user:User):Promise<Task[]> {
        const { status,search }= filterDto;
       const query = this.createQueryBuilder('task');
       query.where({ user });
       if(status){
        query.andWhere('task.status =:status',{status});
       }
       if(search){
        query.andWhere('(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` }
        )
       }
       try{
        const tasks = await query.getMany();
        return tasks;
       }
       catch(error){
        this.logger.error(`Failed to get tasks for user "${user.username}.
        Filters : ${filterDto}`,error.stack)
        throw new InternalServerErrorException();
       }
 
    }
    async createTask(createTaskDto:CreateTaskDto,user:User){
        const {title,description} = createTaskDto;
        const task = this.create({
            title,
            description,
            status:TaskStatus.OPEN,
            user
        })
        await this.save(task);
        return task;
    }
   
}