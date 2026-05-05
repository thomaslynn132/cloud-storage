import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { User } from './user.entity';
import { Download } from './download.entity';

@Entity('files')
@Index(['hash'])
@Index(['expiryDate'])
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.files)
  user: User;

  @Column()
  userId: string;

  @Column()
  fileName: string;

  @Column()
  size: number;

  @Column()
  hash: string;

  @Column()
  storageKey: string;

  @Column({ default: false })
  isPermanent: boolean;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ default: 0 })
  downloadCount: number;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Download, (download) => download.file)
  downloads: Download[];
}
