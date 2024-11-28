import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Post as PostModel } from '@prisma/client';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PostService } from './post.service';
import { CreatePostDTO, UpdatePostDTO, FilterPostsDTO } from './dto/post.dto';
import { JwtAuthGuard } from '../auth/auth.jwt.guard';

@ApiTags('posts')
@Controller('/posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Get('/')
  @ApiOperation({ description: 'Get all posts' })
  async getAllPosts(): Promise<PostModel[]> {
    return this.postService.findAll({});
  }

  @Get('post/:id')
  @ApiOperation({ description: 'Get post by ID' })
  async getPostById(@Param('id') id: string): Promise<PostModel> {
    return this.postService.findOne({ id: Number(id) });
  }

  @Get('feed')
  @ApiOperation({ description: 'Get published posts' })
  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postService.findAll({
      where: { published: true },
    });
  }

  @Get('filtered-posts/:searchString')
  @ApiOperation({ description: 'Get filtered posts' })
  async getFilteredPosts(
    @Param() filterPostsDTO: FilterPostsDTO,
  ): Promise<PostModel[]> {
    const { searchString } = filterPostsDTO;
    return this.postService.findAll({
      where: {
        OR: [
          {
            title: { contains: searchString, mode: 'insensitive' },
          },
          {
            content: { contains: searchString, mode: 'insensitive' },
          },
        ],
      },
    });
  }

  @Post('post')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ description: 'Create a new post draft' })
  @ApiBody({ type: CreatePostDTO })
  async createDraft(
    @Body() createPostDTO: CreatePostDTO,
    @Req() request: any,
  ): Promise<PostModel> {
    const { title, content } = createPostDTO;
    return this.postService.create({
      title,
      content,
      User: {
        connect: { email: request.user.email },
      },
    });
  }

  @Put('post/:id')
  @ApiOperation({ description: 'Update a post' })
  @ApiBody({ type: UpdatePostDTO })
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDTO: UpdatePostDTO,
  ): Promise<PostModel> {
    const { title, content } = updatePostDTO;
    return this.postService.update({
      where: { id: Number(id) },
      data: { title, content },
    });
  }

  @Put('publish/:id')
  @ApiOperation({ description: 'Publish a post' })
  async publishPost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.update({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete('post/:id')
  @ApiOperation({ description: 'Delete a post' })
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.delete({ id: Number(id) });
  }
}
