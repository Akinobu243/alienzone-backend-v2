-- CreateTable
CREATE TABLE "UserSpin" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSpin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserSpin" ADD CONSTRAINT "UserSpin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
