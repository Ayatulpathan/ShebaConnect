import type { Request, Response, NextFunction } from 'express';
import { CompanyOperationsService } from '../services/companyOperations.service.js';

export const createCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organization = await CompanyOperationsService.createOrganization(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Service company registered successfully. Pending platform approval.',
      data: { organization },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organization = await CompanyOperationsService.getMyOrganization(req.user!.id);
    res.status(200).json({
      success: true,
      data: { organization },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organization = await CompanyOperationsService.updateOrganization(
      req.params.id as string,
      req.user!.id,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Company details updated successfully',
      data: { organization },
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { member, user } = await CompanyOperationsService.addMember(
      req.params.id as string,
      req.user!.id,
      req.body
    );
    res.status(201).json({
      success: true,
      message: `${req.body.memberRole} added to company successfully`,
      data: { member, user },
    });
  } catch (error) {
    next(error);
  }
};

export const getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const members = await CompanyOperationsService.getMembers(req.params.id as string, req.user!.id);
    res.status(200).json({
      success: true,
      data: { members },
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await CompanyOperationsService.removeMember(
      req.params.id as string,
      req.user!.id,
      req.params.memberId as string
    );
    res.status(200).json({
      success: true,
      message: 'Member removed from company successfully',
    });
  } catch (error) {
    next(error);
  }
};
