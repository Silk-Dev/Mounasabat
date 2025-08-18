-- CreateEnum
CREATE TYPE "AuditLogLevel" AS ENUM ('info', 'warning', 'error', 'critical');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM (
  'user_login',
  'user_logout', 
  'user_login_failed',
  'password_reset',
  'password_changed',
  'user_created',
  'user_updated',
  'user_deleted',
  'user_suspended',
  'user_activated',
  'provider_approved',
  'provider_rejected',
  'provider_suspended',
  'provider_verified',
  'service_created',
  'service_updated',
  'service_deleted',
  'service_approved',
  'service_rejected',
  'booking_created',
  'booking_updated',
  'booking_cancelled',
  'booking_completed',
  'payment_processed',
  'payment_failed',
  'refund_processed',
  'security_violation',
  'rate_limit_exceeded',
  'unauthorized_access',
  'suspicious_activity',
  'admin_action',
  'system_config_changed',
  'data_export',
  'data_import'
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" "AuditLogLevel" NOT NULL,
    "eventType" "AuditEventType" NOT NULL,
    "userId" TEXT,
    "userRole" TEXT,
    "targetUserId" TEXT,
    "targetResourceId" TEXT,
    "targetResourceType" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_level_idx" ON "audit_logs"("level");

-- CreateIndex
CREATE INDEX "audit_logs_eventType_idx" ON "audit_logs"("eventType");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_targetUserId_idx" ON "audit_logs"("targetUserId");

-- CreateIndex
CREATE INDEX "audit_logs_targetResourceType_idx" ON "audit_logs"("targetResourceType");

-- CreateIndex
CREATE INDEX "audit_logs_success_idx" ON "audit_logs"("success");

-- CreateIndex
CREATE INDEX "audit_logs_sessionId_idx" ON "audit_logs"("sessionId");

-- CreateIndex
CREATE INDEX "audit_logs_level_timestamp_idx" ON "audit_logs"("level", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_eventType_timestamp_idx" ON "audit_logs"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId", "timestamp");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;