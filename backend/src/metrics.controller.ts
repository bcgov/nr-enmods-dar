import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { register } from "./prom";
import { PrismaService } from "nestjs-prisma";
import { Public } from "./auth/decorators/public.decorator";
@Controller("metrics")
export class MetricsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Public()
  async getMetrics(@Res() res: Response) {
    const prismaMetrics = await this.prisma.$metrics.prometheus();
    const appMetrics = await register.metrics();
    res.end(prismaMetrics + appMetrics);
  }
}
