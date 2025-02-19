import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ElementService {
  constructor(private prisma: PrismaService) {}

  public async createElement(
    name: string,
    image: string,
    background?: string | null,
    weaknessId?: number | null,
    strengthId?: number | null,

  ) {
    await this.prisma.element.create({
      data: {
        name,
        image,
        ... ( background && {background} ),
        ... ( weaknessId && {
          weakness: {
            connect: {
              id: weaknessId,
            },
          }}
        ),
        ... ( strengthId && {
          strength: {
            connect: {
              id: strengthId,
            },
          }}
        )
      },
    });
  }

  public async updateElement(
    id: number,
    name?: string,
    image?: string,
    background?: string | null,
    weaknessId?: number | null,
    strengthId?: number | null,
  ) {
    await this.prisma.element.update({
      where: {
        id,
      },
      data: {
        ... ( name && {name} ),
        ... ( image && {image} ),
        ... ( background && {background} ),
        ... ( weaknessId && {
          weakness: {
            connect: {
              id: weaknessId,
            },
          }}
        ),
        ... ( strengthId && {
          strength: {
            connect: {
              id: strengthId,
            },
          }}
        )
      },
    });
  }

}
