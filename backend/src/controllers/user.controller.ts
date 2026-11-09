import type { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await UserService.getProfile(req.user!.id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await UserService.updateProfile(req.user!.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const getAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const addresses = await UserService.getAddresses(req.user!.id);
    res.status(200).json({
      success: true,
      data: { addresses },
    });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const addresses = await UserService.addAddress(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { addresses },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const addresses = await UserService.updateAddress(req.user!.id, req.params.id as string, req.body);
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: { addresses },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const addresses = await UserService.deleteAddress(req.user!.id, req.params.id as string);
    res.status(200).json({
      success: true,
      message: 'Address removed successfully',
      data: { addresses },
    });
  } catch (error) {
    next(error);
  }
};
