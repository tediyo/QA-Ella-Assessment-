import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ConflictException,
  HttpStatus,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ProductStatus } from '../constants';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepo: jest.Mocked<Repository<Transaction>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let productRepo: jest.Mocked<Repository<Product>>;

  const mockUser: User = {
    id: 1,
    name: 'Bob Smith',
    email: 'bob@example.com',
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct: Product = {
    id: 10,
    name: 'USB-C Cable',
    price: 15.0,
    quantity: 5,
    status: ProductStatus.FOR_SALE,
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction: Transaction = {
    id: 100,
    user: mockUser,
    product: mockProduct,
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepo = module.get(getRepositoryToken(Transaction));
    userRepo = module.get(getRepositoryToken(User));
    productRepo = module.get(getRepositoryToken(Product));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateTransactionDto = {
      userId: 1,
      productId: 10,
      quantity: 2,
    };

    it('should throw NotFoundException if user is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow(
        'User with ID 1 not found',
      );
    });

    it('should throw NotFoundException if product is not found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow(
        'Product with ID 10 not found',
      );
    });

    it('should throw ConflictException if requested quantity exceeds available stock', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      productRepo.findOne.mockResolvedValue({ ...mockProduct, quantity: 1 });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        'Requested quantity (2) exceeds available stock (1)',
      );
    });

    it('should create transaction successfully when valid', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      productRepo.findOne.mockResolvedValue({ ...mockProduct, quantity: 5 });
      transactionRepo.create.mockReturnValue(mockTransaction);
      transactionRepo.save.mockResolvedValue(mockTransaction);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.create(dto);

      expect(transactionRepo.create).toHaveBeenCalledWith({
        user: mockUser,
        product: expect.any(Object),
        quantity: 2,
      });
      expect(transactionRepo.save).toHaveBeenCalledWith(mockTransaction);
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.data).toEqual(mockTransaction);
    });
  });

  describe('findAll', () => {
    it('should return list of transactions', async () => {
      transactionRepo.find.mockResolvedValue([mockTransaction]);

      const result = await service.findAll();

      expect(transactionRepo.find).toHaveBeenCalledWith({
        relations: ['user', 'product'],
      });
      expect(result.data).toEqual([mockTransaction]);
    });
  });

  describe('findOne', () => {
    it('should return transaction when found', async () => {
      transactionRepo.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findOne(100);

      expect(result.data).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      transactionRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
