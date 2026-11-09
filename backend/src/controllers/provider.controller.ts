import type { Request, Response, NextFunction } from 'express';
import { ProviderService } from '../services/provider.service.js';

export const addOrUpdateListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const listing = await ProviderService.addOrUpdateListing(req.user!.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Service listing updated successfully',
      data: { listing },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const listings = await ProviderService.getMyListings(req.user!.id);

    res.status(200).json({
      success: true,
      data: { listings },
    });
  } catch (error) {
    next(error);
  }
};

export const searchProviders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const area = req.query.area as string | undefined;
    const serviceId = req.query.serviceId as string | undefined;

    const providers = await ProviderService.searchProviders(area, serviceId);

    res.status(200).json({
      success: true,
      data: { providers },
    });
  } catch (error) {
    next(error);
  }
};

export const getProviderProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const profile = await ProviderService.getProviderPublicProfile(req.params.id as string);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};
