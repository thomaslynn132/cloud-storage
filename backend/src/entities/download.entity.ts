import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { File } from './file.entity';

@Entity('downloads')
@Index(['fileId'])
export class Download {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => File, (file) => file.downloads)
  file: File;

  @Column()
  fileId: string;

  @Column()
  ipAddress: string;

  @Column({ default: false })
  adShown: boolean;

  @Column({ default: false })
  adClicked: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
