-- Keep the Prisma client API camel-cased while exposing the required database names.
ALTER TABLE "User" RENAME COLUMN "isAdmin" TO "is_admin";
ALTER TABLE "User" RENAME COLUMN "isReferee" TO "is_referee";
ALTER INDEX "User_isAdmin_idx" RENAME TO "User_is_admin_idx";
ALTER INDEX "User_isReferee_idx" RENAME TO "User_is_referee_idx";

ALTER TABLE "RefereeApplication" RENAME TO "referee_applications";
ALTER TABLE "referee_applications" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "referee_applications" RENAME COLUMN "realName" TO "real_name";
ALTER TABLE "referee_applications" RENAME COLUMN "basketballExperience" TO "basketball_experience";
ALTER TABLE "referee_applications" RENAME COLUMN "refereeExperience" TO "referee_experience";
ALTER TABLE "referee_applications" RENAME COLUMN "hasCertificate" TO "has_certificate";
ALTER TABLE "referee_applications" RENAME COLUMN "certificateUrl" TO "certificate_url";
ALTER TABLE "referee_applications" RENAME COLUMN "availableTimes" TO "available_times";
ALTER TABLE "referee_applications" RENAME COLUMN "adminNote" TO "admin_note";
ALTER TABLE "referee_applications" RENAME COLUMN "reviewedById" TO "reviewed_by";
ALTER TABLE "referee_applications" RENAME COLUMN "reviewedAt" TO "reviewed_at";
ALTER TABLE "referee_applications" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "referee_applications" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "referee_applications" RENAME CONSTRAINT "RefereeApplication_pkey" TO "referee_applications_pkey";
ALTER TABLE "referee_applications" RENAME CONSTRAINT "RefereeApplication_userId_fkey" TO "referee_applications_user_id_fkey";
ALTER TABLE "referee_applications" RENAME CONSTRAINT "RefereeApplication_reviewedById_fkey" TO "referee_applications_reviewed_by_fkey";
ALTER INDEX "RefereeApplication_status_createdAt_idx" RENAME TO "referee_applications_status_created_at_idx";
ALTER INDEX "RefereeApplication_userId_idx" RENAME TO "referee_applications_user_id_idx";

ALTER TABLE "AdminLog" RENAME TO "admin_logs";
ALTER TABLE "admin_logs" RENAME COLUMN "adminId" TO "admin_id";
ALTER TABLE "admin_logs" RENAME COLUMN "targetType" TO "target_type";
ALTER TABLE "admin_logs" RENAME COLUMN "targetId" TO "target_id";
ALTER TABLE "admin_logs" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "admin_logs" RENAME CONSTRAINT "AdminLog_pkey" TO "admin_logs_pkey";
ALTER TABLE "admin_logs" RENAME CONSTRAINT "AdminLog_adminId_fkey" TO "admin_logs_admin_id_fkey";
ALTER INDEX "AdminLog_createdAt_idx" RENAME TO "admin_logs_created_at_idx";
ALTER INDEX "AdminLog_targetType_targetId_idx" RENAME TO "admin_logs_target_type_target_id_idx";
ALTER INDEX "AdminLog_adminId_idx" RENAME TO "admin_logs_admin_id_idx";
