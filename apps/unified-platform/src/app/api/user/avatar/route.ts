import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/database/prisma";
import { logger } from '@/lib/production-logger';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const userId = formData.get('userId') as string;

    if (!image || !userId) {
      return NextResponse.json(
        { error: 'Image and user ID are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // In a real implementation, you would:
    // 1. Upload the image to a cloud storage service (AWS S3, Cloudinary, etc.)
    // 2. Get the URL of the uploaded image
    // 3. Update the user's image field in the database
    
    // For now, we'll simulate this process
    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:${image.type};base64,${base64Image}`;

    // Update user's image in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });

    return NextResponse.json({
      success: true,
      imageUrl: updatedUser.image,
      message: 'Profile picture updated successfully',
    });
  } catch (error) {
    logger.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}