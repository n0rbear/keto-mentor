-- Add source-specific identities without changing existing catalog or user data.
ALTER TYPE "FoodSource" ADD VALUE IF NOT EXISTS 'usda_fdc';
ALTER TYPE "FoodSource" ADD VALUE IF NOT EXISTS 'bls';
