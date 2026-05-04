import { IsString } from 'class-validator';

export class VerifyAdDto {
  @IsString()
  adToken: string;
}
