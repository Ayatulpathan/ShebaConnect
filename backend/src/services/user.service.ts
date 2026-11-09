import mongoose from 'mongoose';
import { User, type IUser, type IUserAddress } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

interface UpdateProfileInput {
  name?: string;
  phone?: string;
  preferredLanguage?: 'bn' | 'en';
  avatarUrl?: string;
}

interface AddressInput {
  label?: string;
  area: string;
  addressLine: string;
  isDefault?: boolean;
}

export class UserService {
  /**
   * Retrieve user profile
   */
  static async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return user;
  }

  /**
   * Update editable profile fields (Strictly prevents altering role, status, or verification)
   */
  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    if (input.name) user.name = input.name.trim();
    if (input.preferredLanguage) user.preferredLanguage = input.preferredLanguage;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl;

    if (input.phone && input.phone !== user.phone) {
      const existing = await User.findOne({ phone: input.phone, _id: { $ne: userId } });
      if (existing) {
        throw AppError.conflict('Phone number is already associated with another account', 'PHONE_EXISTS');
      }
      user.phone = input.phone;
    }

    await user.save();
    return user;
  }

  /**
   * List user addresses
   */
  static async getAddresses(userId: string): Promise<IUserAddress[]> {
    const user = await User.findById(userId).select('addresses');
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return user.addresses || [];
  }

  /**
   * Add a new service address
   */
  static async addAddress(userId: string, input: AddressInput): Promise<IUserAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    // If marked as default or first address, reset other default flags
    if (input.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
      input.isDefault = true;
    }

    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      label: input.label || 'Home',
      area: input.area.toLowerCase().trim(),
      addressLine: input.addressLine.trim(),
      isDefault: !!input.isDefault,
      createdAt: new Date(),
    } as IUserAddress;

    user.addresses.push(newAddress);
    await user.save();

    return user.addresses;
  }

  /**
   * Update an existing address
   */
  static async updateAddress(
    userId: string,
    addressId: string,
    input: Partial<AddressInput>
  ): Promise<IUserAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    const address = user.addresses.find((addr) => addr._id.toString() === addressId);
    if (!address) {
      throw AppError.notFound('Address not found', 'ADDRESS_NOT_FOUND');
    }

    if (input.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
      address.isDefault = true;
    }

    if (input.label) address.label = input.label.trim();
    if (input.area) address.area = input.area.toLowerCase().trim();
    if (input.addressLine) address.addressLine = input.addressLine.trim();

    await user.save();
    return user.addresses;
  }

  /**
   * Delete an address
   */
  static async deleteAddress(userId: string, addressId: string): Promise<IUserAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      throw AppError.notFound('Address not found', 'ADDRESS_NOT_FOUND');
    }

    const wasDefault = user.addresses[addressIndex]?.isDefault;
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default, promote the first remaining address to default
    if (wasDefault && user.addresses.length > 0 && user.addresses[0]) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return user.addresses;
  }
}
