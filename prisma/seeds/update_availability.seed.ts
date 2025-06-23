import { PrismaClient } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  try {
    console.log('Starting to update alien parts availability...');

    // Get all alien part groups with their parts and userIds
    const alienPartGroups = await prisma.alienPartGroup.findMany({
      where: {
        userId: {
          not: null, // Only get groups that have a userId
        },
      },
      select: {
        userId: true,
        parts: {
          select: {
            id: true,
            availability: true,
          },
        },
      },
    });
    console.log(`Found ${alienPartGroups.length} alien part groups to process`);

    // Process each group
    for (const group of alienPartGroups) {
      if (group.userId && group.parts.length > 0) {
        console.log(
          `Processing ${group.parts.length} parts for user ${group.userId}`,
        );

        // Update each part's availability in the group
        for (const part of group.parts) {
          // Get existing availability array or empty array if none exists
          const existingAvailability =
            (part.availability as { userId: number; available: number }[]) ||
            [];

          // Check if user already has an availability entry
          const hasExistingEntry = existingAvailability.some(
            (a) => a.userId === group.userId,
          );

          if (!hasExistingEntry) {
            // Only add new entry if user doesn't already have one
            const newAvailability = [
              ...existingAvailability,
              { userId: group.userId, available: 1.0 },
            ];

            await prisma.alienPart.update({
              where: { id: part.id },
              data: {
                availability: newAvailability,
              },
            });
          }
        }
      }
    }

    console.log('Successfully updated alien parts availability');
  } catch (error) {
    console.error('Error in update_availability seed:', error);
    throw error;
  }
}
