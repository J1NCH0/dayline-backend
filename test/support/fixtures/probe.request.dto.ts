import { IsString, MaxLength } from 'class-validator';

export class ProbeRequestDto {
  @IsString()
  @MaxLength(20)
  name: string;
}
