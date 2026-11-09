import type { Request, Response, NextFunction } from 'express';
import { ProviderOperationsService } from '../services/providerOperations.service.js';

export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await ProviderOperationsService.getOrCreateProfile(req.user!.id);
    res.status(200).json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await ProviderOperationsService.updateProfile(req.user!.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Provider profile updated successfully',
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

export const submitVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await ProviderOperationsService.submitVerification(req.user!.id, req.body);
    res.status(200).json({
      success: true,
      message:
        'National ID & verification documents submitted successfully. Verification status is now PENDING_REVIEW.',
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slots = await ProviderOperationsService.getAvailability(req.user!.id);
    res.status(200).json({
      success: true,
      data: { slots },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slots = await ProviderOperationsService.updateAvailability(req.user!.id, req.body.slots);
    res.status(200).json({
      success: true,
      message: 'Weekly availability schedule updated successfully',
      data: { slots },
    });
  } catch (error) {
    next(error);
  }
};
