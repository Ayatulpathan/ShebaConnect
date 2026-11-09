import type { Request, Response, NextFunction } from 'express';
import { ServiceService } from '../services/service.service.js';

export const getServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;
    const services = await ServiceService.getServices(category);

    res.status(200).json({
      success: true,
      data: { services },
    });
  } catch (error) {
    next(error);
  }
};

export const getService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { service, activeProvidersCount } = await ServiceService.getServiceByIdOrSlug(
      req.params.idOrSlug as string
    );

    res.status(200).json({
      success: true,
      data: { service, activeProvidersCount },
    });
  } catch (error) {
    next(error);
  }
};

export const searchServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ServiceService.searchServices(req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await ServiceService.createService(req.body);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await ServiceService.updateService(req.params.id as string, req.body);

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await ServiceService.deleteService(req.params.id as string);

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
