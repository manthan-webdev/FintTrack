import { Request, Response, NextFunction } from 'express';
import { profileService } from '../services/profileService.js';
import { updateProfileSchema } from '../validators/index.js';
import { sendSuccess } from '../utils/responseHelper.js';

export class ProfileController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const profile = await profileService.getProfile(user.id, user.email);
      sendSuccess(res, profile, 'User profile retrieved');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validatedData = updateProfileSchema.parse(req.body);

      const updated = await profileService.updateProfile(userId, validatedData);
      sendSuccess(res, updated, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const profileController = new ProfileController();
