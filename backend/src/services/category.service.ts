import mongoose from 'mongoose';
import { Category, type ICategory } from '../models/Category.js';
import { Service } from '../models/Service.js';
import { AppError } from '../utils/AppError.js';

interface CategoryInput {
  name: { en: string; bn: string };
  slug: string;
  description: { en: string; bn: string };
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export class CategoryService {
  static async getCategories(includeInactive = false): Promise<ICategory[]> {
    const query = includeInactive ? {} : { isActive: true };
    return Category.find(query).sort({ order: 1, createdAt: 1 });
  }

  static async getCategoryByIdOrSlug(idOrSlug: string): Promise<{ category: ICategory; servicesCount: number }> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

    const category = await Category.findOne(query);
    if (!category) {
      throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
    }

    const servicesCount = await Service.countDocuments({ category: category._id, isActive: true });
    return { category, servicesCount };
  }

  static async createCategory(input: CategoryInput): Promise<ICategory> {
    const existingSlug = await Category.findOne({ slug: input.slug.toLowerCase() });
    if (existingSlug) {
      throw AppError.conflict('Category with this slug already exists', 'CATEGORY_SLUG_EXISTS');
    }

    const category = new Category({
      ...input,
      slug: input.slug.toLowerCase(),
    });

    await category.save();
    return category;
  }

  static async updateCategory(id: string, input: Partial<CategoryInput>): Promise<ICategory> {
    const category = await Category.findById(id);
    if (!category) {
      throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
    }

    if (input.slug && input.slug.toLowerCase() !== category.slug) {
      const existing = await Category.findOne({ slug: input.slug.toLowerCase(), _id: { $ne: id } });
      if (existing) {
        throw AppError.conflict('Category slug already taken', 'CATEGORY_SLUG_EXISTS');
      }
      category.slug = input.slug.toLowerCase();
    }

    if (input.name) category.name = input.name;
    if (input.description) category.description = input.description;
    if (input.icon !== undefined) category.icon = input.icon;
    if (input.order !== undefined) category.order = input.order;
    if (input.isActive !== undefined) category.isActive = input.isActive;

    await category.save();
    return category;
  }

  static async deleteCategory(id: string): Promise<void> {
    const servicesCount = await Service.countDocuments({ category: id });
    if (servicesCount > 0) {
      throw AppError.badRequest(
        `Cannot delete category with ${servicesCount} associated services. Deactivate it or reassign services first.`,
        'CATEGORY_HAS_SERVICES'
      );
    }

    const result = await Category.findByIdAndDelete(id);
    if (!result) {
      throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
    }
  }
}
