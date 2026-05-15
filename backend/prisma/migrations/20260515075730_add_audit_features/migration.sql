-- AlterTable
ALTER TABLE "AuditItem" ADD COLUMN     "condition" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "scannedById" TEXT;

-- CreateTable
CREATE TABLE "AuditAssignee" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuditAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditAssignee_auditId_userId_key" ON "AuditAssignee"("auditId", "userId");

-- AddForeignKey
ALTER TABLE "AuditAssignee" ADD CONSTRAINT "AuditAssignee_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditAssignee" ADD CONSTRAINT "AuditAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
