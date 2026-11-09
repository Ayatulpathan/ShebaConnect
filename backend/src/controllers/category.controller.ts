import type { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service.js';

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'ADMIN';
    const categories = await CategoryService.getCategories(includeInactive);

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, servicesCount } = await CategoryService.getCategoryByIdOrSlug(req.params.idOrSlug as string);

    res.status(200).json({
      success: true,
      data: { category, servicesCount },
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await CategoryService.createCategory(req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await CategoryService.updateCategory(req.params.id as string, req.body);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await CategoryService.deleteCategory(req.params.id as string);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
