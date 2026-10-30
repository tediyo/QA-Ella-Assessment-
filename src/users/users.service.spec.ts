import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, QueryFailedError } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateUserDto = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
    };

    it('should create and return a new user successfully', async () => {
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'User created successfully',
        data: mockUser,
      });
    });

    it('should throw ConflictException when email violates unique constraint (code 23505)', async () => {
      const dbError = new QueryFailedError(
        'query',
        [],
        new Error('duplicate key'),
      );
      (dbError as any).code = '23505';
      repository.create.mockReturnValue(mockUser);
      repository.save.mockRejectedValue(dbError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow('Email already exists');
    });

    it('should throw 500 HttpException on generic database failure', async () => {
      repository.create.mockReturnValue(mockUser);
      repository.save.mockRejectedValue(new Error('Connection lost'));

      await expect(service.create(dto)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all users with relations', async () => {
      repository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['transactions'],
      });
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Users retrieved successfully',
        data: [mockUser],
      });
    });

    it('should throw 500 when repository fails', async () => {
      repository.find.mockRejectedValue(new Error('DB failure'));
      await expect(service.findAll()).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return a user when ID exists', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['transactions'],
      });
      expect(result.data).toEqual(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'User with ID 999 not found',
      );
    });
  });

  describe('update', () => {
    const updateDto: CreateUserDto = {
      name: 'Alice Updated',
      email: 'alice.updated@example.com',
    };

    it('should update and save user when found', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      repository.preload.mockResolvedValue(updatedUser);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(repository.preload).toHaveBeenCalledWith({ id: 1, ...updateDto });
      expect(repository.save).toHaveBeenCalledWith(updatedUser);
      expect(result.data).toEqual(updatedUser);
    });

    it('should throw NotFoundException when preloaded user is undefined', async () => {
      repository.preload.mockResolvedValue(undefined as any);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if updated email already exists (23505)', async () => {
      repository.preload.mockResolvedValue(mockUser);
      const dbError = new QueryFailedError(
        'query',
        [],
        new Error('duplicate key'),
      );
      (dbError as any).code = '23505';
      repository.save.mockRejectedValue(dbError);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
