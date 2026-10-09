import { Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [VehicleController],
  providers: [
    VehicleService,
    {
      provide: VehicleService,
      useFactory: (prisma: PrismaService) => new VehicleService(prisma),
      inject: [PrismaService],
    },
    PrismaService,
  ],
  exports: [VehicleService],
})
export class VehicleModule {}
