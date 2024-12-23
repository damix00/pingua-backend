import { PrismaClient } from "@prisma/client";

export let prisma: PrismaClient;

export async function initPrisma() {
    prisma = new PrismaClient();
    await prisma.$connect();

    console.log("Connected to Prisma");
}
