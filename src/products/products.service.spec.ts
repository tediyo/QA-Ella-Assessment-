import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository, QueryFailedError } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductStatus } from '../constants';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<Repository<Product>>;

  const mockProduct: Product = {
    id: 1,
    name: 'Wireless Keyboard',
    price: 49.99,
    quantity: 10,
    status: ProductStatus.FOR_SALE,
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(getRepositoryToken(Product));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateProductDto = {
      name: 'Wireless Keyboard',
      price: 49.99,
      quantity: 10,
    };

    it('should create product with default FOR_SALE status', async () => {
      repository.create.mockReturnValue(mockProduct);
      repository.save.mockResolvedValue(mockProduct);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        status: ProductStatus.FOR_SALE,
      });
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.data).toEqual(mockProduct);
    });

    it('should throw ConflictException on duplicate product name', async () => {
      const dbError = new QueryFailedError(
        'query',
        [],
        new Error('duplicate key'),
      );
      (dbError as any).code = '23505';
      repository.create.mockReturnValue(mockProduct);
      repository.save.mockRejectedValue(dbError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        'Product name already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return list of products', async () => {
      repository.find.mockResolvedValue([mockProduct]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['transactions'],
      });
      expect(result.data).toEqual([mockProduct]);
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      repository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['transactions'],
      });
      expect(result.data).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(404)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if product is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(99, { name: 'Item', price: 10, quantity: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update and save product when found', async () => {
      const productCopy = { ...mockProduct };
      repository.findOne.mockResolvedValue(productCopy);
      repository.save.mockImplementation(async (entity) => entity as Product);

      const updateDto: CreateProductDto = {
        name: 'Updated Keyboard',
        price: 59.99,
        quantity: 15,
      };

      const result = await service.update(1, updateDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.data?.name).toBe('Updated Keyboard');
      expect(result.data?.quantity).toBe(15);
    });
  });
});
